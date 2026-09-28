import { NextRequest, NextResponse } from "next/server";

type CallbackResponse = {
  token?: unknown;
  expiresIn?: unknown;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim();
  const state = request.nextUrl.searchParams.get("state")?.trim();

  if (!code || !state) {
    return NextResponse.json(
      { error: "code_and_state_required" },
      { status: 400 },
    );
  }

  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    return NextResponse.json(
      { error: "authentication_not_configured" },
      { status: 500 },
    );
  }

  try {
    const callbackUrl = new URL(`${baseUrl}/monzo-callback`);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("state", state);

    const backendResponse = await fetch(callbackUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!backendResponse.ok) {
      const status =
        backendResponse.status >= 400 && backendResponse.status < 500
          ? backendResponse.status
          : 502;

      return NextResponse.json({ error: "callback_failed" }, { status });
    }

    const payload = (await backendResponse.json()) as CallbackResponse;

    if (typeof payload.token !== "string" || !payload.token.trim()) {
      return NextResponse.json(
        { error: "invalid_callback_response" },
        { status: 502 },
      );
    }

    const response = new NextResponse(null, { status: 204 });
    const expiresIn =
      typeof payload.expiresIn === "number" &&
      Number.isSafeInteger(payload.expiresIn) &&
      payload.expiresIn > 0
        ? payload.expiresIn
        : undefined;

    response.cookies.set({
      name: process.env.SESSION_COOKIE_NAME ?? "session",
      value: payload.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(expiresIn ? { maxAge: expiresIn } : {}),
    });
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch {
    return NextResponse.json({ error: "callback_unavailable" }, { status: 502 });
  }
}
