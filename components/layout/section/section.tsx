import type { ReactNode } from "react";
import styles from "./section.module.css";

type SectionProps = {
  action?: ReactNode;
  children: ReactNode;
  heading: string;
  headingId: string;
};

export function Section({ action, children, heading, headingId }: SectionProps) {
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      {action ? (
        <div className={styles.heading}>
          <h2 id={headingId}>{heading}</h2>
          {action}
        </div>
      ) : (
        <h2 id={headingId}>{heading}</h2>
      )}
      {children}
    </section>
  );
}
