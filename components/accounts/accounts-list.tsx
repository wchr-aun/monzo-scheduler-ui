"use client";

import { InlineMessage } from "@/components/ui/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { AccessNotApprovedError } from "@/lib/accounts/client";
import { AccountCard } from "./account-card";
import { useAccounts } from "./use-accounts";
import styles from "./accounts-list.module.css";

export function AccountsList() {
  const { data: accounts, error, isLoading } = useAccounts();

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
