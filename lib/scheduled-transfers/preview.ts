import type {ScheduledTransfersPage} from "./types";

const DAYS_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function dateToString(date: Date) {
  return date.toISOString().replace(/\.\d{3}/, '');
}

export function createPreviewTransfersPage(today = new Date()): ScheduledTransfersPage {
  const next5Days = new Date(today.getTime() + 1.8 * DAYS_IN_MILLISECONDS);
  const lastWeek = new Date(today.getTime() - 7 * DAYS_IN_MILLISECONDS);

  return {
    scheduledTransfers: [
      {
        setup_id: "example-weekly-deposit",
        transfer_id: "example-weekly-deposit-1",
        status: "pending",
        created_at: dateToString(lastWeek),
        executed_at: null,
        scheduled_for: dateToString(next5Days),
        interval: "weekly",
        type: "deposit",
        amount: 5_000,
      },
      {
        setup_id: "example-monthly-withdrawal",
        transfer_id: "example-monthly-withdrawal-1",
        status: "pending",
        created_at: dateToString(lastWeek),
        executed_at: null,
        scheduled_for: dateToString(today),
        interval: "monthly",
        type: "withdrawal",
        amount: 2_500,
      },
      {
        setup_id: "example-completed-withdrawal",
        transfer_id: "example-completed-withdrawal-1",
        status: "completed",
        created_at: dateToString(lastWeek),
        executed_at: dateToString(lastWeek),
        scheduled_for: dateToString(lastWeek),
        interval: "monthly",
        type: "withdrawal",
        amount: 5_000,
      },
    ],
    total: 3,
    limit: 50,
    offset: 0,
  };
}
