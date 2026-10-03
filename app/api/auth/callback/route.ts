import { apiError } from "@/lib/errors/api-error.server";
import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/cookie-names";

type CallbackResponse = {
  token?: unknown;
  expiresIn?: unknown;
  refreshToken?: unknown;
  refreshExpiresIn?: unknown;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim();
  const state = request.nextUrl.searchParams.get("state")?.trim();

  if (!code || !state) {
    return apiError(
      { error: "code_and_state_required" },
      { status: 400 },
    );
  }

  const oauthStateCookie = request.cookies.get("monzo_oauth_state")?.value;

  if (!oauthStateCookie) {
    return apiError(
      { error: "oauth_state_cookie_required" },
      { status: 400 },
    );
  }

  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    return apiError(
      { error: "authentication_not_configured" },
      { status: 500 },
    );
  }

  try {
    const callbackUrl = new URL(`${baseUrl}/monzo-callback`);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("state", state);

    const backendResponse = await fetch(callbackUrl, {
      headers: {
        Accept: "application/json",
        Cookie: `monzo_oauth_state=${oauthStateCookie}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!backendResponse.ok) {
      const status =
        backendResponse.status >= 400 && backendResponse.status < 500
          ? backendResponse.status
          : 502;

      return apiError({ error: "callback_failed" }, { status });
    }

    const rawPayload: unknown = await backendResponse.json();
    if (
      typeof rawPayload !== "object" ||
      rawPayload === null ||
      Array.isArray(rawPayload)
    ) {
      return apiError(
        { error: "invalid_callback_response" },
        { status: 502 },
      );
    }
    const payload = rawPayload as CallbackResponse;

    if (
      typeof payload.token !== "string" ||
      !payload.token.trim() ||
      typeof payload.refreshToken !== "string" ||
      !payload.refreshToken.trim() ||
      (payload.expiresIn !== undefined &&
        (typeof payload.expiresIn !== "number" ||
          !Number.isSafeInteger(payload.expiresIn) ||
          payload.expiresIn <= 0)) ||
      typeof payload.refreshExpiresIn !== "number" ||
      !Number.isSafeInteger(payload.refreshExpiresIn) ||
      payload.refreshExpiresIn <= 0
    ) {
      return apiError(
        { error: "invalid_callback_response" },
        { status: 502 },
      );
    }

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set({
      name: process.env.SESSION_COOKIE_NAME ?? "session",
      value: payload.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: payload.refreshExpiresIn,
    });
    response.cookies.set({
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: payload.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api",
      maxAge: payload.refreshExpiresIn,
    });
    response.cookies.set({
      name: "monzo_oauth_state",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/callback",
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch {
    return apiError({ error: "callback_unavailable" }, { status: 502 });
  }
}
