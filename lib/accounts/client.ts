import { fetchWithSessionRefresh } from "@/lib/auth/fetch-with-session-refresh";
import type { Account, Balance } from "./types";
import { getAccounts, isBalance } from "./validation";

export class AccessNotApprovedError extends Error {
  constructor(message?: string) {
    super(
      message ||
        "You have not yet allowed access to your data. Please allow access in the Monzo app.",
    );
    this.name = "AccessNotApprovedError";
  }
}

function getAccessNotApprovedMessage(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("code" in value)) {
    return null;
  }

  if (value.code !== "monzo_approval_required") {
    return null;
  }

  return "message" in value && typeof value.message === "string"
    ? value.message
    : "";
}

export async function fetchAccounts(url: string): Promise<Account[]> {
  const response = await fetchWithSessionRefresh(url, { cache: "no-store" });
  const payload: unknown = await response.json();

  const accessNotApprovedMessage = getAccessNotApprovedMessage(payload);
  if (response.status === 403 && accessNotApprovedMessage !== null) {
    throw new AccessNotApprovedError(accessNotApprovedMessage);
  }

  if (!response.ok) {
    throw new Error(`Accounts request failed with status ${response.status}`);
  }

  const accounts = getAccounts(payload);

  if (!accounts) {
    throw new Error("Accounts response was invalid");
  }

  return accounts;
}

export async function fetchBalance(url: string): Promise<Balance> {
  const response = await fetchWithSessionRefresh(url, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok || !isBalance(payload)) {
    throw new Error("Balance response was invalid");
  }

  return payload;
}
