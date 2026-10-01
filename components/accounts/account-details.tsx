"use client";

import { PageHeader } from "@/components/layout/page-header";
import { InlineMessage } from "@/components/ui/inline-message";
import { getAccountName } from "@/lib/accounts/name";
import { AccountBalance } from "./account-balance";
import { PotsList } from "./pots-list";
import { useAccounts } from "./use-accounts";
import styles from "./account-details.module.css";

export function AccountDetails({ accountId, userId }: { accountId: string; userId?: string | null }) {
  const { data: accounts, error } = useAccounts();
  const account = accounts?.find((candidate) => candidate.id === accountId);

  return (
    <>
      <PageHeader
        backHref="/console"
        backLabel="Back to accounts"
        eyebrow="Your account"
        title={account ? getAccountName(account, userId) : "Account"}
      />
      {error ? <InlineMessage>Could not load the account name.</InlineMessage> : null}
      <div className={styles.details}>
        <AccountBalance accountId={accountId} />
        <PotsList accountId={accountId} />
      </div>
    </>
  );
}
