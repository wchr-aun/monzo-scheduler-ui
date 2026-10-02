"use client";

import { InlineMessage } from "@/components/ui/inline-message/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator/loading-indicator";
import { AccessNotApprovedError } from "@/lib/accounts/client";
import { AccountCard } from "@/components/accounts/account-card/account-card";
import { useAccounts } from "@/components/accounts/use-accounts";
import styles from "./accounts-list.module.css";

export function AccountsList({ userId }: { userId?: string | null }) {
  const { data: accounts, error, isLoading } = useAccounts();

  if (isLoading || (!accounts && !error)) {
    return (
      <LoadingIndicator label="Loading accounts" />
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
            <AccountCard account={account} key={account.id} userId={userId} />
          ))}
        </ul>
      )}
    </section>
  );
}
