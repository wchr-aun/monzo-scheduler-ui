export type Pot = {
  id: string;
  name: string;
  style: string;
  balance: number;
  currency: string;
  created: string;
  updated: string;
  deleted: boolean;
};

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

function getPots(value: unknown): Pot[] | null {
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

export function getPotsKey(accountId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/pots`;
}

export async function fetchPots(url: string): Promise<Pot[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  const pots = getPots(payload);

  if (!response.ok || !pots) {
    throw new Error("Pots response was invalid");
  }

  return pots;
}
