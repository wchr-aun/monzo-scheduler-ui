import styles from "./loading-indicator.module.css";

export function LoadingIndicator({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`${styles.indicator}${small ? ` ${styles.small}` : ""}`}
      aria-hidden="true"
    />
  );
}
