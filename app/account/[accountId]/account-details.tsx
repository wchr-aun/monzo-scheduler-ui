"use client";

import { useState } from "react";
import useSWR from "swr";

type Balance = {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
};

type Pot = {
  id: string;
  name: string;
  style: string;
  balance: number;
  currency: string;
  created: string;
  updated: string;
  deleted: boolean;
};

function isBalance(value: unknown): value is Balance {
  return (
    typeof value === "object" &&
    value !== null &&
    "balance" in value &&
    typeof value.balance === "number" &&
    Number.isInteger(value.balance) &&
    "total_balance" in value &&
    typeof value.total_balance === "number" &&
    Number.isInteger(value.total_balance) &&
    "currency" in value &&
    typeof value.currency === "string" &&
    value.currency.length === 3 &&
    "spend_today" in value &&
    typeof value.spend_today === "number" &&
    Number.isInteger(value.spend_today)
  );
}

function isPot(value: unknown): value is Pot {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    "name" in value &&
    typeof value.name === "string" &&
    "style" in value &&
    typeof value.style === "string" &&
    "balance" in value &&
    typeof value.balance === "number" &&
    Number.isInteger(value.balance) &&
    "currency" in value &&
    typeof value.currency === "string" &&
    value.currency.length === 3 &&
    "created" in value &&
    typeof value.created === "string" &&
    "updated" in value &&
    typeof value.updated === "string" &&
    "deleted" in value &&
    typeof value.deleted === "boolean"
  );
}

function getPots(value: unknown): Pot[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("pots" in value) ||
    !Array.isArray(value.pots) ||
    !value.pots.every(isPot)
  ) {
    return null;
  }

  return value.pots;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${amount} ${currency}`;
  }
}

async function fetchBalance(url: string): Promise<Balance> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok || !isBalance(payload)) {
    throw new Error("Balance response was invalid");
  }

  return payload;
}

async function fetchPots(url: string): Promise<Pot[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  const pots = getPots(payload);

  if (!response.ok || !pots) {
    throw new Error("Pots response was invalid");
  }

  return pots;
}

export function AccountDetails({ accountId }: { accountId: string }) {
  const encodedAccountId = encodeURIComponent(accountId);
  const {
    data: balance,
    error: balanceError,
    isLoading: isBalanceLoading,
  } = useSWR(`/api/accounts/${encodedAccountId}/balance`, fetchBalance);
  const {
    data: pots,
    error: potsError,
    isLoading: isPotsLoading,
  } = useSWR(`/api/accounts/${encodedAccountId}/pots`, fetchPots);
  const [hideDeletedPots, setHideDeletedPots] = useState(true);
  const visiblePots = pots?.filter((pot) => !hideDeletedPots || !pot.deleted) ?? [];

  return (
    <div className="account-details">
      <section className="detail-section" aria-labelledby="balance-heading">
        <h2 id="balance-heading">Balance</h2>
        {isBalanceLoading || (!balance && !balanceError) ? (
          <p className="accounts-message">Loading balance…</p>
        ) : balanceError || !balance ? (
          <p className="accounts-message accounts-error" role="alert">
            Could not load the balance.
          </p>
        ) : (
          <dl className="balance-grid">
            <div>
              <dt>Balance</dt>
              <dd>{formatMoney(balance.balance, balance.currency)}</dd>
            </div>
            <div>
              <dt>Total balance</dt>
              <dd>
                {formatMoney(
                  balance.total_balance,
                  balance.currency,
                )}
              </dd>
            </div>
            <div>
              <dt>Spent today</dt>
              <dd>
                {formatMoney(
                  balance.spend_today,
                  balance.currency,
                )}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="detail-section" aria-labelledby="pots-heading">
        <div className="detail-section-heading">
          <h2 id="pots-heading">Pots</h2>
          <label className="toggle-control">
            <input
              type="checkbox"
              role="switch"
              checked={hideDeletedPots}
              onChange={(event) => setHideDeletedPots(event.target.checked)}
            />
            <span>Hide deleted pots</span>
          </label>
        </div>
        {isPotsLoading || (!pots && !potsError) ? (
          <p className="accounts-message">Loading pots…</p>
        ) : potsError || !pots ? (
          <p className="accounts-message accounts-error" role="alert">
            Could not load pots.
          </p>
        ) : visiblePots.length === 0 ? (
          <p className="accounts-message">
            {hideDeletedPots && pots.length > 0
              ? "No active pots found."
              : "No pots found."}
          </p>
        ) : (
          <ul className="pot-list">
            {visiblePots.map((pot) => (
              <li className="pot" key={pot.id}>
                <div className="pot-heading">
                  <h3>{pot.name || "Unnamed pot"}</h3>
                  {pot.deleted ? <span className="deleted-label">Deleted</span> : null}
                </div>
                <p className="pot-balance">
                  {formatMoney(pot.balance, pot.currency)}
                </p>
                <dl>
                  <div>
                    <dt>Style</dt>
                    <dd>{pot.style || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{pot.created}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{pot.updated}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
