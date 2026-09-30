import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import Link from "next/link";
import styles from "./navbar.module.css";

export function Navbar() {
  return (
    <nav className={styles.navbar} aria-label="Site controls">
      <div className={styles.content}>
        <Link className={styles.brand} href="/" aria-label="Monzo Scheduler home">
          <Image
            className={`${styles.logo} ${styles.lightLogo}`}
            src="/logo.png"
            alt="Monzo Scheduler"
            width={1254}
            height={1254}
            priority
          />
          <Image
            className={`${styles.logo} ${styles.darkLogo}`}
            src="/logo-dark-mode.png"
            alt="Monzo Scheduler"
            width={1254}
            height={1254}
            priority
          />
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
