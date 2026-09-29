"use client";

import { Section } from "@/components/layout/section";
import { CreateScheduledTransfer } from "@/components/scheduled-transfers/create-scheduled-transfer";
import { InlineMessage } from "@/components/ui/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { formatMoney } from "@/lib/formatting/money";
import { fetchPots } from "@/lib/pots/client";
import { getPotsKey } from "@/lib/pots/keys";
import useSWR from "swr";
import styles from "./pot-details.module.css";

export function PotDetails({
  accountId,
  potId,
}: {
  accountId: string;
  potId: string;
}) {
  const { data: pots, error, isLoading } = useSWR(
    getPotsKey(accountId),
    fetchPots,
  );
  const pot = pots?.find((candidate) => candidate.id === potId);

  if (isLoading || (!pots && !error)) {
    return (
      <div className={styles.message} role="status" aria-label="Loading pot">
        <LoadingIndicator />
      </div>
    );
  }

  if (error || !pots) {
    return <InlineMessage tone="error">Could not load the pot.</InlineMessage>;
  }

  if (!pot) {
    return <InlineMessage>Pot not found.</InlineMessage>;
  }

  return (
    <>
      <Section heading="Balance" headingId="pot-balance-heading">
        <p className={styles.balance}>{formatMoney(pot.balance, pot.currency)}</p>
      </Section>
      <CreateScheduledTransfer
        accountId={accountId}
        potId={potId}
        balance={pot.balance}
        currency={pot.currency}
      />
    </>
  );
}
