import Link from "next/link";
import styles from "./page-header.module.css";

type PageHeaderProps = {
  backHref: string;
  backLabel: string;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function PageHeader({ backHref, backLabel, eyebrow, subtitle, title }: PageHeaderProps) {
  return (
    <>
      <Link className={styles.backLink} href={backHref}>
        ← {backLabel}
      </Link>
      <header className={styles.header}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
    </>
  );
}
