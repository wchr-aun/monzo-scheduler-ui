"use client";

import Link from "next/link";
import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  type Balance,
  fetchBalance,
  formatMoney,
  getBalanceKey,
  getBalanceLoadedAtKey,
  isBalance,
} from "./account-data";

type Account = {
  id: string;
  description: string;
  created: string;
  balance_details: Balance | null;
};

class AccessNotApprovedError extends Error {}

function isAccessNotApproved(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    value.code === "forbidden.insufficient_permissions"
  );
}

function isAccount(value: unknown): value is Account {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    "description" in value &&
    typeof value.description === "string" &&
    "created" in value &&
    typeof value.created === "string" &&
    Boolean(value.created.trim()) &&
    "balance_details" in value &&
    (value.balance_details === null || isBalance(value.balance_details))
  );
}

function getAccounts(value: unknown): Account[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("accounts" in value) ||
    !Array.isArray(value.accounts) ||
    !value.accounts.every(isAccount)
  ) {
    return null;
  }

  return value.accounts;
}

async function fetchAccounts(url: string): Promise<Account[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (response.status === 403 && isAccessNotApproved(payload)) {
    throw new AccessNotApprovedError();
  }

  if (!response.ok) {
    throw new Error(`Accounts request failed with status ${response.status}`);
  }

  const accounts = getAccounts(payload);

  if (!accounts) {
    throw new Error("Accounts response was invalid");
  }

  return accounts;
}

function AccountCard({ account }: { account: Account }) {
  const encodedAccountId = encodeURIComponent(account.id);
  const {
    data: balance,
    isValidating,
    mutate,
  } = useSWR(getBalanceKey(account.id), fetchBalance, {
    fallbackData: account.balance_details ?? undefined,
    revalidateOnMount: false,
  });

  return (
    <li className="account">
      <Link className="account-link" href={`/account/${encodedAccountId}`}>
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
      <div className="account-total" aria-live="polite">
        {balance ? (
          <>
            <span>Available balance</span>
            <strong>{formatMoney(balance.balance, balance.currency)}</strong>
            <small className="account-total-secondary">
              Total balance: {formatMoney(balance.total_balance, balance.currency)}
            </small>
          </>
        ) : (
          <>
            <span>Available balance</span>
            <button
              className="balance-retry"
              type="button"
              aria-label={`${isValidating ? "Retrying" : "Retry"} balance for ${account.description || account.id}`}
              disabled={isValidating}
              onClick={() => void mutate()}
            >
              {isValidating ? (
                <span
                  className="loading-indicator loading-indicator-small"
                  aria-hidden="true"
                />
              ) : (
                "Retry"
              )}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

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
    "/api/accounts",
    fetchAccountsAndCacheBalances,
    { revalidateIfStale: false },
  );

  if (isLoading || (!accounts && !error)) {
    return (
      <div className="accounts-message" role="status" aria-label="Loading accounts">
        <span className="loading-indicator" aria-hidden="true" />
      </div>
    );
  }

  if (error instanceof AccessNotApprovedError) {
    return (
      <p className="accounts-message accounts-error" role="alert">
        You have not yet allowed access to your data. Please allow access to your
        data in the Monzo app.
      </p>
    );
  }

  if (error || !accounts) {
    return <p className="accounts-message">Could not load accounts.</p>;
  }

  return (
    <section className="accounts" aria-labelledby="accounts-heading">
      <h2 id="accounts-heading">Accounts</h2>
      {accounts.length === 0 ? (
        <p className="accounts-message">No accounts found.</p>
      ) : (
        <ul className="account-list">
          {accounts.map((account) => (
            <AccountCard account={account} key={account.id} />
          ))}
        </ul>
      )}
    </section>
  );
}
