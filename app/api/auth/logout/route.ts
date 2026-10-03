import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchAuthenticatedBackend } from "@/lib/auth/backend-fetch.server";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/cookie-names";
import { getUserId } from "@/lib/auth/session.server";

export async function POST() {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    const userId = getUserId(token);

    if (!userId) {
      return NextResponse.json({ error: "invalid_session" }, { status: 401 });
    }

    const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "");

    if (!baseUrl) {
      return NextResponse.json(
        { error: "authentication_not_configured" },
        { status: 500 },
      );
    }

    try {
      const backendResponse = await fetchAuthenticatedBackend(
        `${baseUrl}/logout`,
        token,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: userId,
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!backendResponse.ok) {
        const status =
          backendResponse.status >= 400 && backendResponse.status < 500
            ? backendResponse.status
            : 502;
        return NextResponse.json({ error: "logout_failed" }, { status });
      }
    } catch {
      return NextResponse.json({ error: "logout_unavailable" }, { status: 502 });
    }
  }

  const response = new NextResponse(null, { status: 204 });

  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
