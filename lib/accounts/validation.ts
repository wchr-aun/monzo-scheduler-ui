import type { Account, Balance } from "./types";

export function isBalance(value: unknown): value is Balance {
  return (
    typeof value === "object" &&
    value !== null &&
    "balance" in value &&
    typeof value.balance === "number" &&
    Number.isInteger(value.balance) &&
    "total_balance" in value &&
    typeof value.total_balance === "number" &&
    Number.isInteger(value.total_balance) &&
    "currency" in value &&
    typeof value.currency === "string" &&
    value.currency.length === 3
  );
}

function isAccount(value: unknown): value is Account {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    "description" in value &&
    typeof value.description === "string" &&
    "balance_details" in value &&
    (value.balance_details === null || isBalance(value.balance_details))
  );
}

export function getAccounts(value: unknown): Account[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("accounts" in value) ||
    !Array.isArray(value.accounts) ||
    !value.accounts.every(isAccount)
  ) {
    return null;
  }

  return value.accounts;
}
