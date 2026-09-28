export type Balance = {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
};

export const BALANCE_CACHE_WINDOW_MS = 60 * 1_000;

export function getBalanceKey(accountId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/balance`;
}

export function getBalanceLoadedAtKey(accountId: string) {
  return `${getBalanceKey(accountId)}::loaded-at`;
}

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
    value.currency.length === 3 &&
    "spend_today" in value &&
    typeof value.spend_today === "number" &&
    Number.isInteger(value.spend_today)
  );
}

export async function fetchBalance(url: string): Promise<Balance> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok || !isBalance(payload)) {
    throw new Error("Balance response was invalid");
  }

  return payload;
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${amount} ${currency}`;
  }
}
