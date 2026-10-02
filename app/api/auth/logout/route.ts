import { NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/cookie-names";

export async function POST() {
  const response = new NextResponse(null, { status: 204 });

  response.cookies.set({
    name: process.env.SESSION_COOKIE_NAME ?? "session",
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
