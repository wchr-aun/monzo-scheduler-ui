"use client";

import { useEffect, useState } from "react";

type Account = {
  id: string;
  description: string;
  created: string;
};

type AccountsState =
  | { status: "loading" }
  | { status: "loaded"; accounts: Account[] }
  | { status: "access-not-approved" }
  | { status: "error" };

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

export function AccountsList() {
  const [state, setState] = useState<AccountsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccounts() {
      try {
        const response = await fetch("/api/accounts", {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload: unknown = await response.json();

        if (response.status === 403 && isAccessNotApproved(payload)) {
          setState({ status: "access-not-approved" });
          return;
        }

        if (!response.ok) {
          throw new Error(`Accounts request failed with status ${response.status}`);
        }

        const accounts = getAccounts(payload);

        if (!accounts) {
          throw new Error("Accounts response was invalid");
        }

        setState({ status: "loaded", accounts });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setState({ status: "error" });
        }
      }
    }

    void loadAccounts();
    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <p className="accounts-message">Loading accounts…</p>;
  }

  if (state.status === "error") {
    return <p className="accounts-message">Could not load accounts.</p>;
  }

  if (state.status === "access-not-approved") {
    return (
      <p className="accounts-message accounts-error" role="alert">
        You have not yet allowed access to your data. Please allow access to your
        data in the Monzo app.
      </p>
    );
  }

  return (
    <section className="accounts" aria-labelledby="accounts-heading">
      <h2 id="accounts-heading">Accounts</h2>
      {state.accounts.length === 0 ? (
        <p className="accounts-message">No accounts found.</p>
      ) : (
        <ul className="account-list">
          {state.accounts.map((account) => (
            <li className="account" key={account.id}>
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
