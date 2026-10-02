import type { ReactNode } from "react";
import styles from "./page-container.module.css";

type PageContainerProps = {
  children: ReactNode;
  centered?: boolean;
  live?: "off" | "polite" | "assertive";
  width?: "narrow" | "wide";
};

export function PageContainer({
  centered = false,
  children,
  live,
  width = "wide",
}: PageContainerProps) {
  return (
    <main className={`${styles.page}${centered ? ` ${styles.centered}` : ""}`} aria-live={live}>
      <div className={`${styles.content} ${styles[width]}`}>{children}</div>
    </main>
  );
}
