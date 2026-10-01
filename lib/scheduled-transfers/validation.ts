import type { ScheduledTransfer, ScheduledTransfersPage } from "./types";

export function isScheduledTransfer(value: unknown): value is ScheduledTransfer {
  return (
    typeof value === "object" &&
    value !== null &&
    "setup_id" in value &&
    typeof value.setup_id === "string" &&
    Boolean(value.setup_id.trim()) &&
    "transfer_id" in value &&
    typeof value.transfer_id === "string" &&
    Boolean(value.transfer_id.trim()) &&
    "status" in value &&
    typeof value.status === "string" &&
    Boolean(value.status.trim()) &&
    "created_at" in value &&
    typeof value.created_at === "string" &&
    Boolean(value.created_at.trim()) &&
    "executed_at" in value &&
    (value.executed_at === null ||
      (typeof value.executed_at === "string" &&
        Boolean(value.executed_at.trim()))) &&
    "scheduled_for" in value &&
    typeof value.scheduled_for === "string" &&
    Boolean(value.scheduled_for.trim()) &&
    "interval" in value &&
    typeof value.interval === "string" &&
    Boolean(value.interval.trim()) &&
    "type" in value &&
    typeof value.type === "string" &&
    Boolean(value.type.trim()) &&
    "amount" in value &&
    typeof value.amount === "number" &&
    Number.isInteger(value.amount)
  );
}

export function getScheduledTransfers(value: unknown): ScheduledTransfersPage | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("scheduledTransfers" in value) ||
    !Array.isArray(value.scheduledTransfers) ||
    !value.scheduledTransfers.every(isScheduledTransfer) ||
    !("total" in value) ||
    typeof value.total !== "number" ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    !("limit" in value) ||
    typeof value.limit !== "number" ||
    !Number.isSafeInteger(value.limit) ||
    value.limit < 1 ||
    value.limit > 100 ||
    !("offset" in value) ||
    typeof value.offset !== "number" ||
    !Number.isSafeInteger(value.offset) ||
    value.offset < 0
  ) {
    return null;
  }

  return {
    scheduledTransfers: value.scheduledTransfers,
    total: value.total,
    limit: value.limit,
    offset: value.offset,
  };
}
