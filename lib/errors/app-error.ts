export type ErrorSource = "frontend" | "backend" | "connection";
export type ErrorOperation = "load accounts" | "load the balance" | "load pots" | "load scheduled transfers" | "create the scheduled transfer" | "cancel the scheduled transfer" | "log out" | "start login" | "complete login" | "display this page" | "restore browser preferences" | "save browser preferences";

export class AppError extends Error {
  constructor(
    public readonly source: ErrorSource,
    public readonly operation: ErrorOperation,
    public readonly code = "unexpected_error",
    public readonly status?: number,
  ) {
    super(errorMessage(source, operation, code, status));
    this.name = "AppError";
  }
}

function errorMessage(source: ErrorSource, operation: ErrorOperation, code: string, status?: number) {
  if (source === "frontend" && code === "preference_restore_failed") return "Frontend error: Could not restore saved preferences. Default settings are being used.";
  if (source === "frontend" && code === "preference_save_failed") return "Frontend error: Could not save your preferences. Your changes still apply for this visit.";
  if (source === "frontend") return `Frontend error: Could not ${operation}. Try reloading the page.`;
  if (source === "connection") return `Connection error: Could not ${operation}. Check your connection and try again.`;
  if (status === 401) return "Backend error: Your session has expired. Please log in again.";
  if (code === "authentication_not_configured") return "Backend error: Authentication is not configured. Please try again later.";
  if (code.startsWith("invalid_") && code.endsWith("_response")) return `Backend error: Could not ${operation} because the service returned an invalid response. Please try again.`;
  if (status === 403) return `Backend error: You do not have permission to ${operation}.`;
  return `Backend error: Could not ${operation}. Please try again.`;
}

export function isAborted(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

export function normaliseError(error: unknown, operation: ErrorOperation = "display this page"): AppError {
  if (error instanceof AppError) return error;
  // Next.js marks server-rendering failures with a digest and hides their details.
  if (error instanceof Error && "digest" in error && typeof error.digest === "string") {
    return new AppError("backend", operation);
  }
  return new AppError("frontend", operation);
}
