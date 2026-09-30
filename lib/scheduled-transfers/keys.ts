export function getScheduledTransfersKey(accountId: string, potId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/pots/${encodeURIComponent(potId)}/scheduled-transfers`;
}

export function getScheduledTransfersPageKey(
  accountId: string,
  potId: string,
  statuses: readonly string[],
  offset: number,
) {
  const searchParams = new URLSearchParams({ status: statuses.join(",") });

  if (offset > 0) {
    searchParams.set("limit", "50");
    searchParams.set("offset", String(offset));
  }

  return `${getScheduledTransfersKey(accountId, potId)}?${searchParams}`;
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
