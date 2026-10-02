import styles from "./loading-indicator.module.css";

type LoadingIndicatorProps = {
  label?: string;
  small?: boolean;
};

export function LoadingIndicator({ label, small = false }: LoadingIndicatorProps) {
  const indicator = (
    <span
      className={`${styles.indicator}${small ? ` ${styles.small}` : ""}`}
      aria-hidden="true"
    />
  );

  return label ? (
    <div className={styles.message} role="status" aria-label={label}>
      {indicator}
    </div>
  ) : indicator;
}
