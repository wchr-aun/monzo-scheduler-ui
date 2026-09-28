import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Pot = {
  id: string;
  name: string;
  style: string;
  balance: number;
  currency: string;
  created: string;
  updated: string;
  deleted: boolean;
};

type RouteContext = {
  params: Promise<{ accountId: string }>;
};

function isPot(value: unknown): value is Pot {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    "name" in value &&
    typeof value.name === "string" &&
    "style" in value &&
    typeof value.style === "string" &&
    "balance" in value &&
    typeof value.balance === "number" &&
    Number.isInteger(value.balance) &&
    "currency" in value &&
    typeof value.currency === "string" &&
    value.currency.length === 3 &&
    "created" in value &&
    typeof value.created === "string" &&
    Boolean(value.created.trim()) &&
    "updated" in value &&
    typeof value.updated === "string" &&
    Boolean(value.updated.trim()) &&
    "deleted" in value &&
    typeof value.deleted === "boolean"
  );
}

function getPots(value: unknown): Pot[] | null {
  const pots =
    Array.isArray(value)
      ? value
      : typeof value === "object" &&
          value !== null &&
          "pots" in value &&
          Array.isArray(value.pots)
        ? value.pots
        : null;

  return pots?.every(isPot) ? pots : null;
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
    const backendUrl = new URL(`${baseUrl}/pots`);
    backendUrl.searchParams.set("current_account_id", accountId);

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

      return NextResponse.json({ error: "pots_failed" }, { status });
    }

    const pots = getPots(await backendResponse.json());

    if (!pots) {
      return NextResponse.json(
        { error: "invalid_pots_response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      pots: pots.map(
        ({ id, name, style, balance, currency, created, updated, deleted }) => ({
          id,
          name,
          style,
          balance,
          currency,
          created,
          updated,
          deleted,
        }),
      ),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "pots_unavailable" }, { status: 502 });
  }
}
