import "server-only";
import { NextResponse } from "next/server";

/** Preserve endpoint-specific error codes and identify failures from the server API. */
export function apiError(payload: { error: string } | { code: string; message?: string }, options: { status: number }) {
  return NextResponse.json({ ...payload, source: "backend" }, options);
}
