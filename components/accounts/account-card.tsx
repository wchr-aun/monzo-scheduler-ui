"use client";

import { BalanceCard } from "@/components/ui/balance-card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Money } from "@/components/ui/money";
import { fetchBalance } from "@/lib/accounts/client";
import { getBalanceKey } from "@/lib/accounts/keys";
import type { Account } from "@/lib/accounts/types";
import useSWR from "swr";
import styles from "./account-card.module.css";

export function AccountCard({
  account,
  userId,
}: {
  account: Account;
  userId?: string | null;
}) {
  const accountName =
    userId && account.description === userId
      ? "Main Account"
      : account.description || "Unnamed account";
  const {
    data: balance,
    isValidating,
    mutate,
  } = useSWR(getBalanceKey(account.id), fetchBalance, {
    fallbackData: account.balance_details ?? undefined,
    revalidateOnMount: false,
  });

  return (
    <li>
      <BalanceCard
        title={accountName}
        href={`/console/account/${encodeURIComponent(account.id)}`}
        linkLabel={`View ${accountName}`}
        balance={
          <div className={styles.total} aria-live="polite">
            <span>Available balance</span>
            {balance ? (
              <>
                <strong>
                  <Money
                    amount={balance.balance}
                    currency={balance.currency}
                    label="available balance"
                  />
                </strong>
                <small>
                  Total balance:{" "}
                  <Money
                    amount={balance.total_balance}
                    currency={balance.currency}
                    label="total balance"
                  />
                </small>
              </>
            ) : (
              <button
                className={styles.retry}
                type="button"
                aria-label={`${isValidating ? "Retrying" : "Retry"} balance for ${accountName}`}
                disabled={isValidating}
                onClick={() => void mutate()}
              >
                {isValidating ? <LoadingIndicator small /> : "Retry"}
              </button>
            )}
          </div>
        }
      />
    </li>
  );
}
