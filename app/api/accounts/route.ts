import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import { getAccounts } from "@/lib/accounts/validation";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    return NextResponse.json(
      { error: "authentication_not_configured" },
      { status: 500 },
    );
  }

  try {
    const backendResponse = await fetch(`${baseUrl}/accounts-with-balances`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
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
        "detail" in errorPayload &&
        typeof errorPayload.detail === "object" &&
        errorPayload.detail !== null &&
        "code" in errorPayload.detail &&
        typeof errorPayload.detail.code === "string"
      ) {
        return NextResponse.json(
          {
            code: errorPayload.detail.code,
            ...("message" in errorPayload.detail &&
              typeof errorPayload.detail.message === "string"
              ? { message: errorPayload.detail.message }
              : {}),
          },
          { status },
        );
      }

      if (
        typeof errorPayload === "object" &&
        errorPayload !== null &&
        "code" in errorPayload &&
        typeof errorPayload.code === "string"
      ) {
        return NextResponse.json({ code: errorPayload.code }, { status });
      }

      return NextResponse.json({ error: "accounts_failed" }, { status });
    }

    const payload: unknown = await backendResponse.json();

    const validatedAccounts = getAccounts(payload);

    if (!validatedAccounts) {
      return NextResponse.json(
        { error: "invalid_accounts_response" },
        { status: 502 },
      );
    }

    const accounts = validatedAccounts.map(
      ({ id, description, balance_details }) => ({
        id,
        description,
        balance_details: balance_details
          ? {
              balance: balance_details.balance,
              total_balance: balance_details.total_balance,
              currency: balance_details.currency,
            }
          : null,
      }),
    );
    const response = NextResponse.json({ accounts });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "accounts_unavailable" }, { status: 502 });
  }
}
