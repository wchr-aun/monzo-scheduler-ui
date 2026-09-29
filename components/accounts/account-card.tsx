"use client";

import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { fetchBalance } from "@/lib/accounts/client";
import { getBalanceKey } from "@/lib/accounts/keys";
import type { Account } from "@/lib/accounts/types";
import { formatMoney } from "@/lib/formatting/money";
import Link from "next/link";
import useSWR from "swr";
import styles from "./account-card.module.css";

export function AccountCard({ account }: { account: Account }) {
  const {
    data: balance,
    isValidating,
    mutate,
  } = useSWR(getBalanceKey(account.id), fetchBalance, {
    fallbackData: account.balance_details ?? undefined,
    revalidateOnMount: false,
  });

  return (
    <li className={styles.card}>
      <Link
        className={styles.link}
        href={`/account/${encodeURIComponent(account.id)}`}
      >
        <h3>{account.description || "Unnamed account"}</h3>
        <dl>
          <div>
            <dt>ID</dt>
            <dd>{account.id}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{account.created}</dd>
          </div>
        </dl>
      </Link>
      <div className={styles.total} aria-live="polite">
        <span>Available balance</span>
        {balance ? (
          <>
            <strong>{formatMoney(balance.balance, balance.currency)}</strong>
            <small>
              Total balance: {formatMoney(balance.total_balance, balance.currency)}
            </small>
          </>
        ) : (
          <button
            className={styles.retry}
            type="button"
            aria-label={`${isValidating ? "Retrying" : "Retry"} balance for ${account.description || account.id}`}
            disabled={isValidating}
            onClick={() => void mutate()}
          >
            {isValidating ? <LoadingIndicator small /> : "Retry"}
          </button>
        )}
      </div>
    </li>
  );
}
