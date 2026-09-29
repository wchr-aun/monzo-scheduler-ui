"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import {
  BALANCE_CACHE_WINDOW_MS,
  fetchBalance,
  formatMoney,
  getBalanceKey,
  getBalanceLoadedAtKey,
} from "../../account-data";
import { fetchPots, getPotsKey, type Pot } from "../../pot-data";

function BalanceLoadingIndicator() {
  return (
    <span
      className="loading-indicator loading-indicator-small"
      aria-hidden="true"
    />
  );
}

function PotSummary({ pot }: { pot: Pot }) {
  return (
    <>
      <div className="pot-heading">
        <h3>{pot.name || "Unnamed pot"}</h3>
        {pot.deleted ? <span className="deleted-label">Deleted</span> : null}
      </div>
      <p className="pot-balance">{formatMoney(pot.balance, pot.currency)}</p>
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
    </>
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
    getPotsKey(accountId),
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
              <li key={pot.id}>
                {pot.deleted ? (
                  <div className="pot pot-disabled" aria-disabled="true">
                    <PotSummary pot={pot} />
                  </div>
                ) : (
                  <Link
                    className="pot"
                    href={`/account/${encodeURIComponent(accountId)}/pot/${encodeURIComponent(pot.id)}`}
                  >
                    <PotSummary pot={pot} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
