import type { ScheduledTransfersPage } from "./types";
import { getScheduledTransfers } from "./validation";

export async function fetchScheduledTransfers(
  url: string,
): Promise<ScheduledTransfersPage> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  const transfers = getScheduledTransfers(payload);

  if (!response.ok || !transfers) {
    throw new Error("Scheduled transfers response was invalid");
  }

  return transfers;
}
