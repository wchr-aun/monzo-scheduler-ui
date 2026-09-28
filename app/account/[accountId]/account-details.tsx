"use client";

import { useEffect, useState } from "react";

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

type ResourceState<T> =
  | { status: "loading" }
  | { status: "loaded"; value: T }
  | { status: "error" };

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

export function AccountDetails({ accountId }: { accountId: string }) {
  const [balance, setBalance] = useState<ResourceState<Balance>>({
    status: "loading",
  });
  const [pots, setPots] = useState<ResourceState<Pot[]>>({ status: "loading" });
  const [hideDeletedPots, setHideDeletedPots] = useState(true);
  const visiblePots =
    pots.status === "loaded"
      ? pots.value.filter((pot) => !hideDeletedPots || !pot.deleted)
      : [];

  useEffect(() => {
    const controller = new AbortController();
    const encodedAccountId = encodeURIComponent(accountId);

    async function loadBalance() {
      try {
        const response = await fetch(
          `/api/accounts/${encodedAccountId}/balance`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload: unknown = await response.json();

        if (!response.ok || !isBalance(payload)) {
          throw new Error("Balance response was invalid");
        }

        setBalance({ status: "loaded", value: payload });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setBalance({ status: "error" });
        }
      }
    }

    async function loadPots() {
      try {
        const response = await fetch(`/api/accounts/${encodedAccountId}/pots`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        const loadedPots = getPots(payload);

        if (!response.ok || !loadedPots) {
          throw new Error("Pots response was invalid");
        }

        setPots({ status: "loaded", value: loadedPots });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPots({ status: "error" });
        }
      }
    }

    void Promise.all([loadBalance(), loadPots()]);
    return () => controller.abort();
  }, [accountId]);

  return (
    <div className="account-details">
      <section className="detail-section" aria-labelledby="balance-heading">
        <h2 id="balance-heading">Balance</h2>
        {balance.status === "loading" ? (
          <p className="accounts-message">Loading balance…</p>
        ) : balance.status === "error" ? (
          <p className="accounts-message accounts-error" role="alert">
            Could not load the balance.
          </p>
        ) : (
          <dl className="balance-grid">
            <div>
              <dt>Balance</dt>
              <dd>{formatMoney(balance.value.balance, balance.value.currency)}</dd>
            </div>
            <div>
              <dt>Total balance</dt>
              <dd>
                {formatMoney(
                  balance.value.total_balance,
                  balance.value.currency,
                )}
              </dd>
            </div>
            <div>
              <dt>Spent today</dt>
              <dd>
                {formatMoney(
                  balance.value.spend_today,
                  balance.value.currency,
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
        {pots.status === "loading" ? (
          <p className="accounts-message">Loading pots…</p>
        ) : pots.status === "error" ? (
          <p className="accounts-message accounts-error" role="alert">
            Could not load pots.
          </p>
        ) : visiblePots.length === 0 ? (
          <p className="accounts-message">
            {hideDeletedPots && pots.value.length > 0
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
