"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  BALANCE_CACHE_WINDOW_MS,
  fetchBalance,
  formatMoney,
  getBalanceKey,
  getBalanceLoadedAtKey,
} from "../../account-data";

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

async function fetchPots(url: string): Promise<Pot[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  const pots = getPots(payload);

  if (!response.ok || !pots) {
    throw new Error("Pots response was invalid");
  }

  return pots;
}

function BalanceLoadingIndicator() {
  return (
    <span
      className="loading-indicator loading-indicator-small"
      aria-hidden="true"
    />
  );
}

export function AccountDetails({ accountId }: { accountId: string }) {
  const balanceKey = getBalanceKey(accountId);
  const { data: balanceLoadedAt } = useSWR<number>(
    getBalanceLoadedAtKey(accountId),
    null,
  );
  const hasFreshEnrichedBalance =
    balanceLoadedAt !== undefined &&
    Date.now() - balanceLoadedAt < BALANCE_CACHE_WINDOW_MS;
  const {
    data: balance,
    error: balanceError,
    isLoading: isBalanceLoading,
  } = useSWR(balanceKey, fetchBalance, {
    revalidateOnMount: !hasFreshEnrichedBalance,
  });
  const {
    data: pots,
    error: potsError,
    isLoading: isPotsLoading,
  } = useSWR(
    `/api/accounts/${encodeURIComponent(accountId)}/pots`,
    fetchPots,
  );
  const [hideDeletedPots, setHideDeletedPots] = useState(true);
  const visiblePots = pots?.filter((pot) => !hideDeletedPots || !pot.deleted) ?? [];
  const balanceIsLoading = isBalanceLoading || !balance;

  return (
    <div className="account-details">
      <section className="detail-section" aria-labelledby="balance-heading">
        <h2 id="balance-heading">Balance</h2>
        {balanceError ? (
          <p className="accounts-message accounts-error" role="alert">
            Could not load the balance.
          </p>
        ) : (
          <dl
            className="balance-grid"
            aria-busy={balanceIsLoading}
            aria-label={balanceIsLoading ? "Loading balance" : undefined}
            role={balanceIsLoading ? "status" : undefined}
          >
            <div>
              <dt>Balance</dt>
              <dd>
                {balance ? (
                  formatMoney(balance.balance, balance.currency)
                ) : (
                  <BalanceLoadingIndicator />
                )}
              </dd>
            </div>
            <div>
              <dt>Total balance</dt>
              <dd>
                {balance ? (
                  formatMoney(balance.total_balance, balance.currency)
                ) : (
                  <BalanceLoadingIndicator />
                )}
              </dd>
            </div>
            <div>
              <dt>Spent today</dt>
              <dd>
                {balance ? (
                  formatMoney(balance.spend_today, balance.currency)
                ) : (
                  <BalanceLoadingIndicator />
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
          <div className="accounts-message" role="status" aria-label="Loading pots">
            <span className="loading-indicator" aria-hidden="true" />
          </div>
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
