import type { Pot } from "./types";

function isPot(value: unknown): value is Pot {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    "name" in value &&
    typeof value.name === "string" &&
    "style" in value &&
    typeof value.style === "string" &&
    "balance" in value &&
    typeof value.balance === "number" &&
    Number.isInteger(value.balance) &&
    "currency" in value &&
    typeof value.currency === "string" &&
    value.currency.length === 3 &&
    "created" in value &&
    typeof value.created === "string" &&
    "updated" in value &&
    typeof value.updated === "string" &&
    "deleted" in value &&
    typeof value.deleted === "boolean"
  );
}

export function getPots(value: unknown): Pot[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("pots" in value) ||
    !Array.isArray(value.pots) ||
    !value.pots.every(isPot)
  ) {
    return null;
  }

  return value.pots;
}
