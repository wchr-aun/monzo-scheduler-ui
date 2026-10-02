import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./balance-card.module.css";

type BalanceCardProps = {
  balance: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  href?: string;
  linkLabel?: string;
  title: string;
};

export function BalanceCard({
  balance,
  badge,
  disabled = false,
  href,
  linkLabel,
  title,
}: BalanceCardProps) {
  return (
    <div
      className={`${styles.card}${disabled ? ` ${styles.disabled}` : ""}`}
      aria-disabled={disabled ? "true" : undefined}
    >
      {href && !disabled ? (
        <Link className={styles.link} href={href} aria-label={linkLabel} />
      ) : null}
      <div className={styles.content}>
        <div className={styles.heading}>
          <h3>{title}</h3>
          {badge}
        </div>
        <div className={styles.balance}>{balance}</div>
      </div>
    </div>
  );
}
