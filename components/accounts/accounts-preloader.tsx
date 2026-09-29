"use client";

import { useAccounts } from "./use-accounts";

export function AccountsPreloader() {
  useAccounts();

  return null;
}
