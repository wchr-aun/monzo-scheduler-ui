"use client";

import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons/arrow-icon";
import { LoadingIndicator } from "@/components/ui/loading-indicator/loading-indicator";
import { Money } from "@/components/ui/money/money";
import { fetchBalance } from "@/lib/accounts/client";
import { getBalanceKey } from "@/lib/accounts/keys";
import { getAccountName } from "@/lib/accounts/name";
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
  const accountName = getAccountName(account, userId);
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
      <div className={styles.card}>
        <Link
          className={styles.link}
          href={`/console/account/${encodeURIComponent(account.id)}`}
          aria-label={`View ${accountName}`}
        />
        <div className={styles.content}>
          <div className={styles.heading}>
            <h3>{accountName}</h3>
          </div>
          <div className={styles.total} aria-live="polite">
            {balance ? (
              <strong>
                <Money
                  amount={balance.balance}
                  currency={balance.currency}
                  label="available balance"
                />
              </strong>
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
          <div className={styles.details} aria-live="polite">
            <span>Available balance</span>
            {balance ? (
              <small>
                Total balance:{" "}
                <Money
                  amount={balance.total_balance}
                  currency={balance.currency}
                  label="total balance"
                />
              </small>
            ) : null}
          </div>
          <span className={styles.open} aria-hidden="true">
            View details <ArrowIcon direction="up-right" />
          </span>
        </div>
      </div>
    </li>
  );
}
