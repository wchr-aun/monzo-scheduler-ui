"use client";

import type { ConsoleClient } from "@/lib/console/types";
import { createContext, useContext } from "react";
import { fetchAccounts, fetchBalance } from "@/lib/accounts/client";
import { fetchPots } from "@/lib/pots/client";
import { fetchScheduledTransfers } from "@/lib/scheduled-transfers/client";
import { request } from "@/lib/errors/request";

const backendClient = {
  basePath: "/console",
  fetchAccounts,
  fetchBalance,
  fetchPots,
  fetchScheduledTransfers,
  request,
};

export const ConsoleClientContext = createContext<ConsoleClient>(backendClient);
export function useConsoleClient() {
  return useContext(ConsoleClientContext);
}
