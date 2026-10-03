import { request, readJson } from "@/lib/errors/request";
import { AppError } from "@/lib/errors/app-error";
import type { ScheduledTransfersPage } from "./types";
import { getScheduledTransfers } from "./validation";

export async function fetchScheduledTransfers(
  url: string,
): Promise<ScheduledTransfersPage> {
  const response = await request(url, { cache: "no-store" }, "load scheduled transfers");
  const payload = await readJson(response, "load scheduled transfers");
  const transfers = getScheduledTransfers(payload);

  if (!transfers) {
    throw new AppError("backend", "load scheduled transfers", "invalid_scheduled_transfers_response");
  }

  return transfers;
}
