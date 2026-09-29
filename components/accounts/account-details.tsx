"use client";

import { AccountBalance } from "./account-balance";
import { PotsList } from "./pots-list";
import styles from "./account-details.module.css";

export function AccountDetails({ accountId }: { accountId: string }) {
  return (
    <div className={styles.details}>
      <AccountBalance accountId={accountId} />
      <PotsList accountId={accountId} />
    </div>
  );
}
