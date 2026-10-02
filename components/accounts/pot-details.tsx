"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CreateScheduledTransfer } from "@/components/scheduled-transfers/create-scheduled-transfer";
import { InlineMessage } from "@/components/ui/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Money } from "@/components/ui/money";
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
  const header = (
    <PageHeader
      backHref={`/console/account/${encodeURIComponent(accountId)}`}
      backLabel="Back to account"
      eyebrow="Your pot"
      title={pot ? pot.name || "Unnamed pot" : "Pot"}
    />
  );

  if (isLoading || (!pots && !error)) {
    return (
      <>
        {header}
        <LoadingIndicator label="Loading pot" />
      </>
    );
  }

  if (error || !pots) {
    return (
      <>
        {header}
        <InlineMessage tone="error">Could not load the pot.</InlineMessage>
      </>
    );
  }

  if (!pot) {
    return (
      <>
        {header}
        <InlineMessage>Pot not found.</InlineMessage>
      </>
    );
  }

  return (
    <>
      {header}
      <section className={styles.balanceCard} aria-labelledby="pot-balance-heading">
        <h2 id="pot-balance-heading">Pot balance</h2>
        <p className={styles.balance}>
          <Money
            amount={pot.balance}
            currency={pot.currency}
            label="pot balance"
          />
        </p>
      </section>
      <CreateScheduledTransfer
        accountId={accountId}
        potId={potId}
        currency={pot.currency}
      />
    </>
  );
}
