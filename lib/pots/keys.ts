export function getPotsKey(accountId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/pots`;
}
