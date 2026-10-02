import "server-only";
import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/cookie-names";

type RefreshPayload = {
  token?: unknown;
  expiresIn?: unknown;
  refreshToken?: unknown;
  refreshExpiresIn?: unknown;
};

type RefreshResult = {
  status: number;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    refreshExpiresIn: number;
  };
};

function positiveSeconds(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
}

async function requestRefreshedTokens(refreshToken: string): Promise<RefreshResult> {
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    return { status: 500 };
  }

  try {
    const backendResponse = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!backendResponse.ok) {
      return {
        status:
          backendResponse.status >= 400 && backendResponse.status < 500
            ? backendResponse.status
            : 502,
      };
    }

    const payload = (await backendResponse.json()) as RefreshPayload;
    const expiresIn = positiveSeconds(payload.expiresIn);
    const refreshExpiresIn = positiveSeconds(payload.refreshExpiresIn);
    const rotatedRefreshToken =
      typeof payload.refreshToken === "string" && payload.refreshToken.trim()
        ? payload.refreshToken
        : undefined;

    if (
      typeof payload.token !== "string" ||
      !payload.token.trim() ||
      !expiresIn ||
      !refreshExpiresIn ||
      (payload.refreshToken !== undefined && !rotatedRefreshToken)
    ) {
      return { status: 502 };
    }

    return {
      status: 204,
      tokens: {
        accessToken: payload.token,
        refreshToken: rotatedRefreshToken ?? refreshToken,
        refreshExpiresIn,
      },
    };
  } catch {
    return { status: 502 };
  }
}

export async function refreshSession(): Promise<RefreshResult> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return { status: 401 };
  }

  const result = await requestRefreshedTokens(refreshToken);

  if (!result.tokens) {
    if ([400, 401, 403].includes(result.status)) {
      const secure = process.env.NODE_ENV === "production";
      cookieStore.set({
        name: process.env.SESSION_COOKIE_NAME ?? "session",
        value: "",
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      cookieStore.set({
        name: REFRESH_TOKEN_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/api",
        maxAge: 0,
      });
    }

    return result;
  }

  const secure = process.env.NODE_ENV === "production";
  cookieStore.set({
    name: process.env.SESSION_COOKIE_NAME ?? "session",
    value: result.tokens.accessToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: result.tokens.refreshExpiresIn,
  });
  cookieStore.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: result.tokens.refreshToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api",
    maxAge: result.tokens.refreshExpiresIn,
  });

  return result;
}

export async function fetchBackendWithRefresh(
  url: string | URL,
  accessToken: string,
  init: RequestInit,
): Promise<Response> {
  const makeRequest = (token: string) => {
    const headers = {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    };
    return fetch(url, { ...init, headers, cache: "no-store" });
  };

  const response = await makeRequest(accessToken);

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshSession();

  if (refreshed.status !== 204 || !refreshed.tokens) {
    return response;
  }

  return makeRequest(refreshed.tokens.accessToken);
}
