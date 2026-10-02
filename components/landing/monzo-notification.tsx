import Image from "next/image";
import styles from "./monzo-notification.module.css";

type MonzoNotificationProps = {
  title: string;
  message?: string;
};

export function MonzoNotification({title, message}: MonzoNotificationProps) {
  return (
    <div className={styles.notificationCard}>
      <div className={styles.notificationIcon}>
        <Image src="/monzo-logo.png" alt="" width={40} height={40} />
      </div>
      <div className={styles.notificationBody}>
        <div className={styles.notificationHeader}>
          <span>Monzo</span><span>now</span>
        </div>
        <p className={styles.notificationTitle}>{title}</p>
          {message && <p className={styles.notificationMessage}>{message}</p>}
      </div>
    </div>
  );
}
