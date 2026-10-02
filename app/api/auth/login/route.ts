import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    return NextResponse.json(
      { error: "authentication_not_configured" },
      { status: 500 },
    );
  }

  try {
    const backendResponse = await fetch(`${baseUrl}/monzo-redirect`, {
      headers: { Accept: "text/html" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    const location = backendResponse.headers.get("location");

    if (backendResponse.status < 300 || backendResponse.status >= 400 || !location) {
      return NextResponse.json(
        { error: "login_redirect_failed" },
        { status: 502 },
      );
    }

    const redirectUrl = new URL(location, `${baseUrl}/`);
    if (redirectUrl.protocol !== "https:" && redirectUrl.protocol !== "http:") {
      return NextResponse.json(
        { error: "invalid_login_redirect" },
        { status: 502 },
      );
    }

    const oauthStateCookie = backendResponse.headers
      .getSetCookie()
      .map((cookie) => cookie.match(/^monzo_oauth_state=([^;]*)/i)?.[1])
      .find((value) => value !== undefined);

    if (oauthStateCookie === undefined) {
      return NextResponse.json(
        { error: "oauth_state_cookie_missing" },
        { status: 502 },
      );
    }

    const response = NextResponse.redirect(redirectUrl, 302);
    response.cookies.set({
      name: "monzo_oauth_state",
      value: oauthStateCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/callback",
      maxAge: 600,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "login_unavailable" }, { status: 502 });
  }
}
