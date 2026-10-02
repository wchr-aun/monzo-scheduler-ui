"use client";

import {useEffect, useId, useState} from "react";
import {Button} from "@/components/ui/button/button";
import {Money} from "@/components/ui/money/money";
import {StatusBadge} from "@/components/ui/status-badge/status-badge";
import {getScheduledDateTimes, getTimeUntil,} from "@/lib/scheduled-transfers/date-time";
import {getDifferingUuidSections} from "@/lib/scheduled-transfers/id-sections";
import {getTransferRecurrence} from "@/lib/scheduled-transfers/recurrence";
import type {ScheduledTransfer} from "@/lib/scheduled-transfers/types";
import styles from "./scheduled-transfer-card.module.css";

type ScheduledTransferCardProps = {
  cancelling: boolean;
  onCancel: () => void;
  transfer: ScheduledTransfer;
};

export function ScheduledTransferCard({
  cancelling,
  onCancel,
  transfer,
}: ScheduledTransferCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const detailsId = useId();
  const isDeposit = transfer.type === "deposit";
  const recurrence = getTransferRecurrence(transfer.scheduled_for, transfer.interval);
  const differingIdSections = getDifferingUuidSections(
    transfer.transfer_id,
    transfer.setup_id,
  );

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <li
      className={`${styles.card}${isExpanded ? ` ${styles.expanded}` : ""}${transfer.status === "cancelled" ? ` ${styles.cancelled}` : ""}`}
      data-status={transfer.status}
    >
      <button
        className={styles.cardToggle}
        type="button"
        aria-controls={detailsId}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Hide" : "Show"} details for transfer ${transfer.transfer_id}`}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      />

      <div className={styles.summary}>
        <div className={styles.amountGroup}>
          <div className={styles.amountSummary}>
            <div className={styles.amount}>
              <span>{isDeposit ? "+" : "−"}</span>
              <Money
                amount={Math.abs(transfer.amount)}
                currency="GBP"
                label={`transfer ${transfer.transfer_id} amount`}
              />
            </div>
            <p className={styles.scheduleType}>
              {getDisplayLabel(transfer.interval)} {isDeposit ? "deposit" : "withdrawal"}
            </p>
            <p className={styles.recurrence}>
              {recurrence ? (
                <>
                  {recurrence.frequency}
                  {recurrence.isMonthly ? " of month" : ""} - {recurrence.time}
                </>
              ) : "Schedule unavailable"}
            </p>
          </div>
        </div>

        <div className={styles.schedule}>
          <div className={styles.scheduleHeading}>
            {transfer.status === "pending" ? (
              <p
                className={styles.countdown}
                aria-live="off"
              >
                {now === null
                  ? "Calculating…"
                  : getTimeUntil(transfer.scheduled_for, now, transfer.status)}
              </p>
            ) : null}
            <StatusBadge tone={getStatusTone(transfer.status)}>
              {transfer.status}
            </StatusBadge>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div className={styles.details} id={detailsId}>
          <div className={styles.detailsRow}>
            <dl>
              <div>
                <dt>Created at</dt>
                <dd>
                  <TransferDateTime value={transfer.created_at} />
                </dd>
              </div>
              {transfer.executed_at !== null ? (
                <div>
                  <dt>Executed at</dt>
                  <dd>
                    <TransferDateTime value={transfer.executed_at} />
                  </dd>
                </div>
              ) : (
                <div>
                  <dt>Scheduled for</dt>
                  <dd>
                    <TransferDateTime value={transfer.scheduled_for} />
                  </dd>
                </div>
              )}
            </dl>
            {transfer.status === "pending" ? (
              <Button
                variant="danger"
                type="button"
                aria-label={`Cancel transfer ${transfer.transfer_id}`}
                disabled={cancelling}
                onClick={onCancel}
              >
                {cancelling ? "Cancelling…" : "Cancel transfer"}
              </Button>
            ) : null}
          </div>
          <div className={styles.footer}>
            <p>
              Transfer ID:{" "}
              <DifferentiatedId
                differingSections={differingIdSections}
                value={transfer.transfer_id}
              />
            </p>
            <p>
              Setup ID:{" "}
              <DifferentiatedId
                differingSections={differingIdSections}
                value={transfer.setup_id}
              />
            </p>
          </div>
        </div>
      ) : null}

      <span className={styles.chevron} aria-hidden="true" />
    </li>
  );
}

function DifferentiatedId({
  differingSections,
  value,
}: {
  differingSections: boolean[] | null;
  value: string;
}) {
  if (!differingSections) {
    return value;
  }

  return value.split("-").map((section, index) => (
    <span key={`${index}-${section}`}>
      {index > 0 ? "-" : null}
      {differingSections[index] ? (
        <em className={styles.differingIdSection}>{section}</em>
      ) : (
        section
      )}
    </span>
  ));
}

function TransferDateTime({ value }: { value: string }) {
  const dates = getScheduledDateTimes(value);

  if (!dates) {
    return value;
  }

  if (dates.localMatchesUk) {
    return <time dateTime={value}>{dates.uk}</time>;
  }

  return (
    <span className={styles.times}>
      <time dateTime={value}>{dates.local}</time>
      <time dateTime={value}>{dates.uk}</time>
    </span>
  );
}

function getDisplayLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusTone(status: string) {
  switch (status) {
    case "completed":
    case "pending":
    case "cancelled":
    case "failed":
      return status;
    default:
      return "neutral";
  }
}
