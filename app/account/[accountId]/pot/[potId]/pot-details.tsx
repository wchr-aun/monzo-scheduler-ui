"use client";

import useSWR from "swr";
import { formatMoney } from "../../../../account-data";
import { fetchPots, getPotsKey } from "../../../../pot-data";
import { CreateScheduledTransfer } from "./create-scheduled-transfer";

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
      <div className="accounts-message" role="status" aria-label="Loading pot">
        <span className="loading-indicator" aria-hidden="true" />
      </div>
    );
  }

  if (error || !pots) {
    return (
      <p className="accounts-message accounts-error" role="alert">
        Could not load the pot.
      </p>
    );
  }

  if (!pot) {
    return <p className="accounts-message">Pot not found.</p>;
  }

  return (
    <>
      <section className="detail-section" aria-labelledby="pot-balance-heading">
        <h2 id="pot-balance-heading">Balance</h2>
        <p className="pot-page-balance">
          {formatMoney(pot.balance, pot.currency)}
        </p>
      </section>
      <CreateScheduledTransfer
        accountId={accountId}
        potId={potId}
        balance={pot.balance}
        currency={pot.currency}
      />
    </>
  );
}
