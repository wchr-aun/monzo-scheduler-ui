"use client";

import Link from "next/link";
import useSWR from "swr";

type Account = {
  id: string;
  description: string;
  created: string;
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
    Boolean(value.created.trim())
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

export function AccountsList() {
  const { data: accounts, error, isLoading } = useSWR(
    "/api/accounts",
    fetchAccounts,
  );

  if (isLoading || (!accounts && !error)) {
    return <p className="accounts-message">Loading accounts…</p>;
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
            <li className="account" key={account.id}>
              <Link
                className="account-link"
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
