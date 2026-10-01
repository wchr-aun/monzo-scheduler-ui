import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import styles from "./pot-preview.module.css";

const transfers = [
  { amount: "+£50.00", name: "Weekly top-up", date: "Every Monday · 09:00 UK", status: "pending" },
  { amount: "−£25.00", name: "Monthly withdrawal", date: "1st of the month · 09:00 UK", status: "pending" },
  { amount: "+£50.00", name: "Weekly top-up", date: "Previous transfer", status: "completed" },
] as const;

export function PotPreview() {
  return (
    <figure className={styles.preview} aria-label="Example pot page with a £1,250 balance and scheduled transfers">
      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.phone}>
        <div className={styles.statusBar} aria-hidden="true">
          <span>9:41</span><span className={styles.camera} /><span>▴ ▰</span>
        </div>
        <div className={styles.appBar}>
          <Image src="/logo-dark-mode.png" alt="" width={30} height={30} />
          <span>Monzo Scheduler</span>
          <span className={styles.menuIcon} aria-hidden="true">•••</span>
        </div>
        <div className={styles.screen}>
          <p className={styles.backLabel}>← Back to account</p>
          <div className={styles.potHeading}>
            <div><p className={styles.eyebrow}>YOUR POT</p><h3>Rainy day</h3></div>
            <span className={styles.potIcon} aria-hidden="true">☂</span>
          </div>
          <div className={styles.balanceCard}>
            <p>Pot balance</p><strong>£1,250<span>.00</span></strong>
            <span className={styles.balanceNote}>A little peace of mind.</span>
          </div>
          <div className={styles.scheduleAction}>Schedule a transfer <span aria-hidden="true">+</span></div>
          <div className={styles.transferHeading}><h4>Scheduled transfers</h4><span>3 transfers</span></div>
          <div className={styles.filter}>Completed, pending <span aria-hidden="true">⌄</span></div>
          <ul className={styles.transfers}>
            {transfers.map((transfer, index) => (
              <li key={index} className={styles.transfer}>
                <div className={styles.transferTop}><strong>{transfer.amount}</strong><StatusBadge tone={transfer.status}>{transfer.status}</StatusBadge></div>
                <p>{transfer.name}</p><span className={styles.transferDate}>{transfer.date}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.homeIndicator} aria-hidden="true" />
      </div>
      <figcaption className={styles.caption}><span className={styles.captionDot} /> Your plans, at a glance. <span>Example data</span></figcaption>
    </figure>
  );
}
