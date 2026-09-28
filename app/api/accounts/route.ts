import {cookies} from "next/headers";
import {NextResponse} from "next/server";

type Account = {
  id: string;
  description: string;
  created: string;
  balance_details: Balance | null;
};

type Balance = {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
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
    value.currency.length === 3 &&
    "spend_today" in value &&
    typeof value.spend_today === "number" &&
    Number.isInteger(value.spend_today)
  );
}

function isAccount(value: unknown): value is Account {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    "description" in value &&
    typeof value.description === "string" &&
    "created" in value &&
    typeof value.created === "string" &&
    Boolean(value.created.trim()) &&
    "balance_details" in value &&
    (value.balance_details === null || isBalance(value.balance_details))
  );
}

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
    const backendResponse = await fetch(`${baseUrl}/accounts-with-balances?account_type=uk_retail`, {
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

      return NextResponse.json({ error: "accounts_failed" }, { status });
    }

    const payload: unknown = await backendResponse.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("accounts" in payload) ||
      !Array.isArray(payload.accounts) ||
      !payload.accounts.every(isAccount)
    ) {
      return NextResponse.json(
        { error: "invalid_accounts_response" },
        { status: 502 },
      );
    }

    const accounts = payload.accounts.map(
      ({ id, description, created, balance_details }) => ({
        id,
        description,
        created,
        balance_details: balance_details
          ? {
              balance: balance_details.balance,
              total_balance: balance_details.total_balance,
              currency: balance_details.currency,
              spend_today: balance_details.spend_today,
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
