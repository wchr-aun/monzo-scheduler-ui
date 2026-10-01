import { StatusBadge } from "@/components/ui/status-badge";
import { Money } from "@/components/ui/money";
import type { Pot } from "@/lib/pots/types";
import Link from "next/link";
import styles from "./pot-card.module.css";

export function PotCard({ accountId, pot }: { accountId: string; pot: Pot }) {
  const potName = pot.name || "Unnamed pot";

  return (
    <li>
      <div
        className={`${styles.card}${pot.deleted ? ` ${styles.disabled}` : ""}`}
        aria-disabled={pot.deleted ? "true" : undefined}
      >
        {pot.deleted ? null : (
          <Link
            className={styles.link}
            href={`/account/${encodeURIComponent(accountId)}/pot/${encodeURIComponent(pot.id)}`}
            aria-label={`View ${potName}`}
          />
        )}
        <div className={styles.content}>
          <PotSummary pot={pot} />
        </div>
      </div>
    </li>
  );
}

function PotSummary({ pot }: { pot: Pot }) {
  return (
    <>
      <div className={styles.heading}>
        <h3>{pot.name || "Unnamed pot"}</h3>
        {pot.deleted ? <StatusBadge tone="deleted">Deleted</StatusBadge> : null}
      </div>
      <p className={styles.balance}>
        <Money
          amount={pot.balance}
          currency={pot.currency}
          label={`${pot.name || "pot"} balance`}
        />
      </p>
    </>
  );
}
