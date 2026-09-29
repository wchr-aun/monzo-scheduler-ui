export const ACCOUNTS_KEY = "/api/accounts";
export const BALANCE_CACHE_WINDOW_MS = 60 * 1_000;

export function getBalanceKey(accountId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/balance`;
}

export function getBalanceLoadedAtKey(accountId: string) {
  return `${getBalanceKey(accountId)}::loaded-at`;
}
