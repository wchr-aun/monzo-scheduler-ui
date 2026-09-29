export function getScheduledTransfersKey(accountId: string, potId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/pots/${encodeURIComponent(potId)}/scheduled-transfers`;
}

export function isScheduledTransfersKey(
  key: unknown,
  accountId: string,
  potId: string,
) {
  if (typeof key !== "string") {
    return false;
  }

  const baseKey = getScheduledTransfersKey(accountId, potId);
  return key === baseKey || key.startsWith(`${baseKey}?`);
}
