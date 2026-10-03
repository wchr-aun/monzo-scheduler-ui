import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowIcon } from "@/components/ui/icons/arrow-icon";
import styles from "./balance-card.module.css";

type BalanceCardProps = {
  balance: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  href?: string;
  linkLabel?: string;
  title: string;
  stacked?: boolean;
  details?: ReactNode;
};

export function BalanceCard({
  balance,
  badge,
  disabled = false,
  href,
  linkLabel,
  title,
  stacked = false,
  details,
}: BalanceCardProps) {
  return (
    <div
      className={`${styles.card}${stacked ? ` ${styles.stacked}` : ""}${disabled ? ` ${styles.disabled}` : ""}`}
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
        {stacked && details ? (
          <div className={styles.details}>{details}</div>
        ) : null}
        {stacked && href && !disabled ? (
          <span className={styles.open} aria-hidden="true">
            View details <ArrowIcon direction="up-right" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
