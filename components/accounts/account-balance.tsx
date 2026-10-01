"use client";

import { InlineMessage } from "@/components/ui/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Money } from "@/components/ui/money";
import { fetchBalance } from "@/lib/accounts/client";
import {
  BALANCE_CACHE_WINDOW_MS,
  getBalanceKey,
  getBalanceLoadedAtKey,
} from "@/lib/accounts/keys";
import type { ReactNode } from "react";
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
    <section aria-label="Account balances">
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
            value={
              balance && (
                <Money
                  amount={balance.balance}
                  currency={balance.currency}
                  label="balance"
                />
              )
            }
          />
          <BalanceValue
            label="Total balance"
            value={
              balance && (
                <Money
                  amount={balance.total_balance}
                  currency={balance.currency}
                  label="total balance"
                />
              )
            }
          />
        </dl>
      )}
    </section>
  );
}

function BalanceValue({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? <LoadingIndicator small />}</dd>
    </div>
  );
}
