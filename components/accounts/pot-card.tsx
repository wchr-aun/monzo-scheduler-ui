import { StatusBadge } from "@/components/ui/status-badge";
import { Money } from "@/components/ui/money";
import type { Pot } from "@/lib/pots/types";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./pot-card.module.css";

export function PotCard({ accountId, pot }: { accountId: string; pot: Pot }) {
  const content = <PotSummary pot={pot} />;

  return (
    <li>
      {pot.deleted ? (
        <div className={`${styles.card} ${styles.disabled}`} aria-disabled="true">
          {content}
        </div>
      ) : (
        <Link
          className={styles.card}
          href={`/account/${encodeURIComponent(accountId)}/pot/${encodeURIComponent(pot.id)}`}
        >
          {content}
        </Link>
      )}
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
        <Money amount={pot.balance} currency={pot.currency} />
      </p>
      <Details>
        <Detail label="Style">{pot.style || "Not specified"}</Detail>
        <Detail label="Created">{pot.created}</Detail>
        <Detail label="Updated">{pot.updated}</Detail>
      </Details>
    </>
  );
}

function Details({ children }: { children: ReactNode }) {
  return <dl>{children}</dl>;
}

function Detail({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
