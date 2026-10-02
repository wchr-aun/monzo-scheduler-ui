"use client";

import { useAccounts } from "@/components/accounts/use-accounts";

export function AccountsPreloader() {
  useAccounts();

  return null;
}
