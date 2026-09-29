export type ScheduledTransfer = {
  setup_id: string;
  transfer_id: string;
  status: string;
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
