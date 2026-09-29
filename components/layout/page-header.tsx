import Link from "next/link";
import styles from "./page-header.module.css";

type PageHeaderProps = {
  backHref: string;
  backLabel: string;
  subtitle?: string;
  title: string;
};

export function PageHeader({ backHref, backLabel, subtitle, title }: PageHeaderProps) {
  return (
    <>
      <Link className={styles.backLink} href={backHref}>
        ← {backLabel}
      </Link>
      <header className={styles.header}>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
    </>
  );
}
