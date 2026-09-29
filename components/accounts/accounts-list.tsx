"use client";

import { InlineMessage } from "@/components/ui/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { AccessNotApprovedError, fetchAccounts } from "@/lib/accounts/client";
import {
  ACCOUNTS_KEY,
  getBalanceKey,
  getBalanceLoadedAtKey,
} from "@/lib/accounts/keys";
import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { AccountCard } from "./account-card";
import styles from "./accounts-list.module.css";

export function AccountsList() {
  const { mutate } = useSWRConfig();
  const fetchAccountsAndCacheBalances = useCallback(
    async (url: string) => {
      const loadedAccounts = await fetchAccounts(url);

      await Promise.all(
        loadedAccounts.map((account) => {
          if (!account.balance_details) {
            return undefined;
          }

          return Promise.all([
            mutate(getBalanceKey(account.id), account.balance_details, false),
            mutate(getBalanceLoadedAtKey(account.id), Date.now(), false),
          ]);
        }),
      );

      return loadedAccounts;
    },
    [mutate],
  );
  const { data: accounts, error, isLoading } = useSWR(
    ACCOUNTS_KEY,
    fetchAccountsAndCacheBalances,
    { revalidateIfStale: false },
  );

  if (isLoading || (!accounts && !error)) {
    return (
      <div className={styles.message} role="status" aria-label="Loading accounts">
        <LoadingIndicator />
      </div>
    );
  }

  if (error instanceof AccessNotApprovedError) {
    return (
      <InlineMessage tone="error">
        You have not yet allowed access to your data. Please allow access to your
        data in the Monzo app.
      </InlineMessage>
    );
  }

  if (error || !accounts) {
    return <InlineMessage>Could not load accounts.</InlineMessage>;
  }

  return (
    <section className={styles.accounts} aria-labelledby="accounts-heading">
      <h2 id="accounts-heading">Accounts</h2>
      {accounts.length === 0 ? (
        <InlineMessage>No accounts found.</InlineMessage>
      ) : (
        <ul className={styles.list}>
          {accounts.map((account) => (
            <AccountCard account={account} key={account.id} />
          ))}
        </ul>
      )}
    </section>
  );
}
