import type { Account, Balance } from "./types";
import { getAccounts, isBalance } from "./validation";

export class AccessNotApprovedError extends Error {}

function isAccessNotApproved(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    value.code === "forbidden.insufficient_permissions"
  );
}

export async function fetchAccounts(url: string): Promise<Account[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (response.status === 403 && isAccessNotApproved(payload)) {
    throw new AccessNotApprovedError();
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
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok || !isBalance(payload)) {
    throw new Error("Balance response was invalid");
  }

  return payload;
}
