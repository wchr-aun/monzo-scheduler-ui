import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth/backend-fetch.server";

export async function POST() {
  const result = await refreshSession();
  const response = result.status === 204
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "refresh_failed" }, { status: result.status });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
