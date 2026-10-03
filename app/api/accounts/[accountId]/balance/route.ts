import { apiError } from "@/lib/errors/api-error.server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isBalance } from "@/lib/accounts/validation";
import { fetchAuthenticatedBackend } from "@/lib/auth/backend-fetch.server";

type RouteContext = {
  params: Promise<{ accountId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { accountId } = await context.params;

  if (!accountId.trim()) {
    return apiError({ error: "account_id_required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return apiError({ error: "not_authenticated" }, { status: 401 });
  }

  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    return apiError(
      { error: "authentication_not_configured" },
      { status: 500 },
    );
  }

  try {
    const backendUrl = new URL(`${baseUrl}/balance`);
    backendUrl.searchParams.set("account_id", accountId);

    const backendResponse = await fetchAuthenticatedBackend(backendUrl, token, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!backendResponse.ok) {
      const status =
        backendResponse.status >= 400 && backendResponse.status < 500
          ? backendResponse.status
          : 502;
      const errorPayload: unknown = await backendResponse
        .json()
        .catch(() => null);

      if (
        typeof errorPayload === "object" &&
        errorPayload !== null &&
        "code" in errorPayload &&
        typeof errorPayload.code === "string"
      ) {
        return apiError({ code: errorPayload.code }, { status });
      }

      return apiError({ error: "balance_failed" }, { status });
    }

    const payload: unknown = await backendResponse.json();

    if (!isBalance(payload)) {
      return apiError(
        { error: "invalid_balance_response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      balance: payload.balance,
      total_balance: payload.total_balance,
      currency: payload.currency,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return apiError({ error: "balance_unavailable" }, { status: 502 });
  }
}
