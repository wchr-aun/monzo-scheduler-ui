"use client";

import { useEffect, useRef } from "react";
import { useAccounts } from "@/components/accounts/use-accounts";
import { AccessNotApprovedError } from "@/lib/accounts/client";
import { useToast } from "@/components/providers/toast-provider/toast-provider";

export function AccountsPreloader() {
  const { data, error } = useAccounts();
  const { show } = useToast();
  const awaitingApproval = useRef(false);

  useEffect(() => {
    if (error instanceof AccessNotApprovedError) {
      awaitingApproval.current = true;
    } else if (!error && data && awaitingApproval.current) {
      awaitingApproval.current = false;
      show({ tone: "success", colour: "info", message: "Monzo access approved." });
    }
  }, [data, error, show]);

  return null;
}
