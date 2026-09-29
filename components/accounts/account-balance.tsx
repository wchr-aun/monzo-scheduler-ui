"use client";

import { Section } from "@/components/layout/section";
import { InlineMessage } from "@/components/ui/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { fetchBalance } from "@/lib/accounts/client";
import {
  BALANCE_CACHE_WINDOW_MS,
  getBalanceKey,
  getBalanceLoadedAtKey,
} from "@/lib/accounts/keys";
import { formatMoney } from "@/lib/formatting/money";
import useSWR from "swr";
import styles from "./account-balance.module.css";

export function AccountBalance({ accountId }: { accountId: string }) {
  const { data: balanceLoadedAt } = useSWR<number>(
    getBalanceLoadedAtKey(accountId),
    null,
  );
  const hasFreshEnrichedBalance =
    balanceLoadedAt !== undefined &&
    Date.now() - balanceLoadedAt < BALANCE_CACHE_WINDOW_MS;
  const {
    data: balance,
    error,
    isLoading,
  } = useSWR(getBalanceKey(accountId), fetchBalance, {
    revalidateOnMount: !hasFreshEnrichedBalance,
  });
  const balanceIsLoading = isLoading || !balance;

  return (
    <Section heading="Balance" headingId="balance-heading">
      {error ? (
        <InlineMessage tone="error">Could not load the balance.</InlineMessage>
      ) : (
        <dl
          className={styles.grid}
          aria-busy={balanceIsLoading}
          aria-label={balanceIsLoading ? "Loading balance" : undefined}
          role={balanceIsLoading ? "status" : undefined}
        >
          <BalanceValue
            label="Balance"
            value={balance && formatMoney(balance.balance, balance.currency)}
          />
          <BalanceValue
            label="Total balance"
            value={balance && formatMoney(balance.total_balance, balance.currency)}
          />
          <BalanceValue
            label="Spent today"
            value={balance && formatMoney(balance.spend_today, balance.currency)}
          />
        </dl>
      )}
    </Section>
  );
}

function BalanceValue({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? <LoadingIndicator small />}</dd>
    </div>
  );
}
