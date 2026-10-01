import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Balance = {
  balance: number;
  total_balance: number;
  currency: string;
};

type RouteContext = {
  params: Promise<{ accountId: string }>;
};

function isBalance(value: unknown): value is Balance {
  return (
    typeof value === "object" &&
    value !== null &&
    "balance" in value &&
    typeof value.balance === "number" &&
    Number.isInteger(value.balance) &&
    "total_balance" in value &&
    typeof value.total_balance === "number" &&
    Number.isInteger(value.total_balance) &&
    "currency" in value &&
    typeof value.currency === "string" &&
    value.currency.length === 3
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { accountId } = await context.params;

  if (!accountId.trim()) {
    return NextResponse.json({ error: "account_id_required" }, { status: 400 });
  }

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
    const backendUrl = new URL(`${baseUrl}/balance`);
    backendUrl.searchParams.set("account_id", accountId);

    const backendResponse = await fetch(backendUrl, {
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
        "code" in errorPayload &&
        typeof errorPayload.code === "string"
      ) {
        return NextResponse.json({ code: errorPayload.code }, { status });
      }

      return NextResponse.json({ error: "balance_failed" }, { status });
    }

    const payload: unknown = await backendResponse.json();

    if (!isBalance(payload)) {
      return NextResponse.json(
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
    return NextResponse.json({ error: "balance_unavailable" }, { status: 502 });
  }
}
