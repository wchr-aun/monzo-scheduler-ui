import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    accountId: string;
    potId: string;
    setupId: string;
  }>;
};

function isCancelTransferResponse(
  value: unknown,
  setupId: string,
): value is { setup_id: string; status: "deactivated" } {
  return (
    typeof value === "object" &&
    value !== null &&
    "setup_id" in value &&
    value.setup_id === setupId &&
    "status" in value &&
    value.status === "deactivated"
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { accountId, potId, setupId } = await context.params;

  if (!accountId.trim() || !potId.trim() || !setupId.trim()) {
    return NextResponse.json(
      { error: "account_pot_and_setup_ids_required" },
      { status: 400 },
    );
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
    const backendResponse = await fetch(
      `${baseUrl}/schedule-transfer/${encodeURIComponent(setupId)}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!backendResponse.ok) {
      const status =
        backendResponse.status >= 400 && backendResponse.status < 500
          ? backendResponse.status
          : 502;

      return NextResponse.json({ error: "cancel_transfer_failed" }, { status });
    }

    const payload: unknown = await backendResponse.json();

    if (!isCancelTransferResponse(payload, setupId)) {
      return NextResponse.json(
        { error: "invalid_cancel_transfer_response" },
        { status: 502 },
      );
    }

    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "cancel_transfer_unavailable" },
      { status: 502 },
    );
  }
}
