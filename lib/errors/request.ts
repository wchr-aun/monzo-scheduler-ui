import { fetchWithSessionRefresh } from "@/lib/auth/fetch-with-session-refresh";
import { AppError, isAborted, type ErrorOperation } from "./app-error";

export async function request(url: string, init: RequestInit, operation: ErrorOperation, refreshSession = true): Promise<Response> {
  let response: Response;
  try {
    response = await (refreshSession ? fetchWithSessionRefresh(url, init) : fetch(url, init));
  } catch (error) {
    if (isAborted(error)) throw error;
    // Only failed fetches are connection errors; validation and rendering are separate.
    if (error instanceof TypeError || (error instanceof Error && error.name === "TimeoutError")) {
      throw new AppError("connection", operation, "connection_failed");
    }
    throw error;
  }

  if (!response.ok) {
    let code = "request_failed";
    try {
      const payload: unknown = await response.json();
      if (typeof payload === "object" && payload !== null) {
        if ("error" in payload && typeof payload.error === "string") code = payload.error;
        else if ("code" in payload && typeof payload.code === "string") code = payload.code;
      }
    } catch (error) {
      if (isAborted(error)) throw error;
      // Non-JSON errors still get a safe message based on operation and HTTP status.
    }
    throw new AppError("backend", operation, code, response.status);
  }
  return response;
}

export async function readJson(response: Response, operation: ErrorOperation): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (isAborted(error)) throw error;
    throw new AppError("backend", operation, "invalid_json_response", response.status);
  }
}
