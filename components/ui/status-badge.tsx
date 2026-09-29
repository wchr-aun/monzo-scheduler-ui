import type { ReactNode } from "react";
import styles from "./status-badge.module.css";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "completed" | "pending" | "cancelled" | "failed" | "deleted";
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`} data-tone={tone}>
      {children}
    </span>
  );
}
