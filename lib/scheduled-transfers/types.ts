export const scheduledTransferStatuses = [
  "completed",
  "pending",
  "failed",
  "cancelled",
] as const;

export const defaultScheduledTransferStatuses = [
  "completed",
  "pending",
  "failed",
] as const;

export type ScheduledTransferStatus =
  (typeof scheduledTransferStatuses)[number];

export type ScheduledTransfer = {
  setup_id: string;
  transfer_id: string;
  status: string;
  created_at: string;
  executed_at: string | null;
  scheduled_for: string;
  interval: string;
  type: string;
  amount: number;
  pot_id: string;
  account_id: string;
};

export type ScheduledTransfersPage = {
  scheduledTransfers: ScheduledTransfer[];
  total: number;
  limit: number;
  offset: number;
};
