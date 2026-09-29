"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatMoney } from "../../../../account-data";

type ScheduledTransfer = {
  setup_id: string;
  transfer_id: string;
  scheduled_for: string;
  interval: string;
  type: string;
  amount: number;
  pot_id: string;
  account_id: string;
};

type ScheduledTransfersPage = {
  scheduledTransfers: ScheduledTransfer[];
  total: number;
  limit: number;
  offset: number;
};

function isScheduledTransfer(value: unknown): value is ScheduledTransfer {
  return (
    typeof value === "object" &&
    value !== null &&
    "setup_id" in value &&
    typeof value.setup_id === "string" &&
    Boolean(value.setup_id.trim()) &&
    "transfer_id" in value &&
    typeof value.transfer_id === "string" &&
    Boolean(value.transfer_id.trim()) &&
    "scheduled_for" in value &&
    typeof value.scheduled_for === "string" &&
    Boolean(value.scheduled_for.trim()) &&
    "interval" in value &&
    typeof value.interval === "string" &&
    Boolean(value.interval.trim()) &&
    "type" in value &&
    typeof value.type === "string" &&
    Boolean(value.type.trim()) &&
    "amount" in value &&
    typeof value.amount === "number" &&
    Number.isInteger(value.amount) &&
    "pot_id" in value &&
    typeof value.pot_id === "string" &&
    Boolean(value.pot_id.trim()) &&
    "account_id" in value &&
    typeof value.account_id === "string" &&
    Boolean(value.account_id.trim())
  );
}

function getScheduledTransfers(value: unknown): ScheduledTransfersPage | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("scheduledTransfers" in value) ||
    !Array.isArray(value.scheduledTransfers) ||
    !value.scheduledTransfers.every(isScheduledTransfer) ||
    !("total" in value) ||
    typeof value.total !== "number" ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0 ||
    !("limit" in value) ||
    typeof value.limit !== "number" ||
    !Number.isSafeInteger(value.limit) ||
    value.limit < 1 ||
    value.limit > 100 ||
    !("offset" in value) ||
    typeof value.offset !== "number" ||
    !Number.isSafeInteger(value.offset) ||
    value.offset < 0
  ) {
    return null;
  }

  return {
    scheduledTransfers: value.scheduledTransfers,
    total: value.total,
    limit: value.limit,
    offset: value.offset,
  };
}

async function fetchScheduledTransfers(url: string): Promise<ScheduledTransfersPage> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json();
  const transfers = getScheduledTransfers(payload);

  if (!response.ok || !transfers) {
    throw new Error("Scheduled transfers response was invalid");
  }

  return transfers;
}

function formatScheduledDate(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

function ScheduledFor({ value }: { value: string }) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const localDate = formatScheduledDate(date);
  const ukDate = formatScheduledDate(date, "Europe/London");

  return (
    <span className="scheduled-transfer-times">
      <span aria-label={`Local: ${localDate}`}>
        Local: <time dateTime={value}>{localDate}</time>
      </span>
      <span aria-label={`UK: ${ukDate}`}>
        UK:{" "}
        <time dateTime={value}>{ukDate}</time>
      </span>
    </span>
  );
}

export function ScheduledTransfers({
  accountId,
  potId,
}: {
  accountId: string;
  potId: string;
}) {
  const scheduledTransfersKey = `/api/accounts/${encodeURIComponent(accountId)}/pots/${encodeURIComponent(potId)}/scheduled-transfers`;
  const [offset, setOffset] = useState(0);
  const pageKey =
    offset === 0
      ? scheduledTransfersKey
      : `${scheduledTransfersKey}?limit=50&offset=${offset}`;
  const { data, error, isLoading, mutate } = useSWR(
    pageKey,
    fetchScheduledTransfers,
  );
  const [pendingSetupIds, setPendingSetupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [cancelMessage, setCancelMessage] = useState<
    { kind: "error" | "success"; text: string } | undefined
  >();

  async function cancelTransfer(transfer: ScheduledTransfer) {
    setCancelMessage(undefined);
    setPendingSetupIds((current) => new Set(current).add(transfer.setup_id));

    try {
      const response = await fetch(
        `${scheduledTransfersKey}/${encodeURIComponent(transfer.setup_id)}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Cancel scheduled transfer request failed");
      }

      await mutate(
        (current) =>
          current
            ? {
                ...current,
                scheduledTransfers: current.scheduledTransfers.filter(
                  (item) => item.setup_id !== transfer.setup_id,
                ),
                total: Math.max(0, current.total - 1),
              }
            : current,
        { revalidate: false },
      );
      setCancelMessage({
        kind: "success",
        text: "Scheduled transfer cancelled.",
      });
    } catch {
      setCancelMessage({
        kind: "error",
        text: "Could not cancel the scheduled transfer.",
      });
    } finally {
      setPendingSetupIds((current) => {
        const next = new Set(current);
        next.delete(transfer.setup_id);
        return next;
      });
    }
  }

  return (
    <section className="detail-section" aria-labelledby="transfers-heading">
      <h2 id="transfers-heading">Scheduled transfers</h2>
      {cancelMessage ? (
        <p
          className={
            cancelMessage.kind === "error"
              ? "form-message accounts-error"
              : "form-message form-success"
          }
          role={cancelMessage.kind === "error" ? "alert" : "status"}
        >
          {cancelMessage.text}
        </p>
      ) : null}
      {isLoading || (!data && !error) ? (
        <div
          className="accounts-message"
          role="status"
          aria-label="Loading scheduled transfers"
        >
          <span className="loading-indicator" aria-hidden="true" />
        </div>
      ) : error || !data ? (
        <p className="accounts-message accounts-error" role="alert">
          Could not load scheduled transfers.
        </p>
      ) : data.scheduledTransfers.length === 0 ? (
        <p className="accounts-message">No scheduled transfers found.</p>
      ) : (
        <ul className="scheduled-transfer-list">
          {data.scheduledTransfers.map((transfer) => (
            <li className="scheduled-transfer" key={transfer.setup_id}>
              <div className="scheduled-transfer-heading">
                <h3>{transfer.transfer_id}</h3>
                <button
                  className="danger-button"
                  type="button"
                  aria-label={`Cancel transfer ${transfer.transfer_id}`}
                  disabled={pendingSetupIds.has(transfer.setup_id)}
                  onClick={() => void cancelTransfer(transfer)}
                >
                  {pendingSetupIds.has(transfer.setup_id)
                    ? "Cancelling…"
                    : "Cancel"}
                </button>
              </div>
              <dl>
                <div>
                  <dt>Scheduled for</dt>
                  <dd>
                    <ScheduledFor value={transfer.scheduled_for} />
                  </dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>{formatMoney(transfer.amount, "GBP")}</dd>
                </div>
                <div>
                  <dt>Interval</dt>
                  <dd>{transfer.interval}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{transfer.type}</dd>
                </div>
                <div>
                  <dt>Setup ID</dt>
                  <dd>{transfer.setup_id}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      {data && data.total > data.limit ? (
        <nav className="pagination" aria-label="Scheduled transfers pages">
          <button
            className="secondary-button"
            type="button"
            disabled={data.offset === 0}
            onClick={() => setOffset(Math.max(0, data.offset - data.limit))}
          >
            Previous
          </button>
          <span>
            {data.offset + 1}–{Math.min(data.offset + data.limit, data.total)} of{" "}
            {data.total}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={data.offset + data.limit >= data.total}
            onClick={() => setOffset(data.offset + data.limit)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
