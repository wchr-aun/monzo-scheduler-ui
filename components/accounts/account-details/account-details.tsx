"use client";

import { useConsoleClient } from "@/components/providers/console-client-provider";

import { PageHeader } from "@/components/layout/page-header/page-header";
import { InlineMessage } from "@/components/ui/inline-message/inline-message";
import { getAccountName } from "@/lib/accounts/name";
import { AccountBalance } from "@/components/accounts/account-balance/account-balance";
import { PotsList } from "@/components/pots/pots-list/pots-list";
import { useAccounts } from "@/components/accounts/use-accounts";
import styles from "./account-details.module.css";

export function AccountDetails({ accountId, userId }: { accountId: string; userId?: string | null }) {
  const { basePath } = useConsoleClient();
  const { data: accounts, error } = useAccounts();
  const account = accounts?.find((candidate) => candidate.id === accountId);

  return (
    <>
      <PageHeader
        backHref={basePath}
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
