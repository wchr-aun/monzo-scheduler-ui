import type { fetchAccounts, fetchBalance } from "@/lib/accounts/client";
import type { fetchPots } from "@/lib/pots/client";
import type { fetchScheduledTransfers } from "@/lib/scheduled-transfers/client";
import type { request } from "@/lib/errors/request";

export type ConsoleClient = {
  basePath: string;
  fetchAccounts: typeof fetchAccounts;
  fetchBalance: typeof fetchBalance;
  fetchPots: typeof fetchPots;
  fetchScheduledTransfers: typeof fetchScheduledTransfers;
  request: typeof request;
};
