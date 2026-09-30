import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Money } from "@/components/ui/money";
import { getScheduledDateTimes } from "@/lib/scheduled-transfers/date-time";
import type { ScheduledTransfer } from "@/lib/scheduled-transfers/types";
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
  return (
    <li
      className={`${styles.card}${transfer.status === "cancelled" ? ` ${styles.cancelled}` : ""}`}
      data-status={transfer.status}
    >
      <div className={styles.heading}>
        <div className={styles.title}>
          <h3>{transfer.transfer_id}</h3>
          <StatusBadge tone={getStatusTone(transfer.status)}>
            {transfer.status}
          </StatusBadge>
        </div>
        {transfer.status === "pending" ? (
          <Button
            variant="danger"
            type="button"
            aria-label={`Cancel transfer ${transfer.transfer_id}`}
            disabled={cancelling}
            onClick={onCancel}
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </Button>
        ) : null}
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
          <dd>
            <Money
              amount={transfer.amount}
              currency="GBP"
              label={`transfer ${transfer.transfer_id} amount`}
            />
          </dd>
        </div>
        <div>
          <dt>Interval</dt>
          <dd>{transfer.interval}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{transfer.type}</dd>
        </div>
      </dl>
      <p className={styles.setupId}>Setup ID: {transfer.setup_id}</p>
    </li>
  );
}

function ScheduledFor({ value }: { value: string }) {
  const dates = getScheduledDateTimes(value);

  if (!dates) {
    return value;
  }

  if (dates.localMatchesUk) {
    return <time dateTime={value}>{dates.uk}</time>;
  }

  return (
    <span className={styles.times}>
      <span aria-label={`Local: ${dates.local}`}>
        Local: <time dateTime={value}>{dates.local}</time>
      </span>
      <span aria-label={`UK: ${dates.uk}`}>
        UK: <time dateTime={value}>{dates.uk}</time>
      </span>
    </span>
  );
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
