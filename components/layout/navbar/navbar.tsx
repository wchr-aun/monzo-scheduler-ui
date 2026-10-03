import {ThemeToggle} from "@/components/ui/theme-toggle/theme-toggle";
import {MoneyVisibilityToggle} from "@/components/ui/money-visibility-toggle/money-visibility-toggle";
import Image from "next/image";
import Link from "next/link";
import styles from "./navbar.module.css";

export function Navbar({
  logoHref = "/console",
  demoMode = false,
}: {
  logoHref?: string;
  demoMode?: boolean;
}) {
  return (
    <nav className={styles.navbar} aria-label="Site controls">
      <div className={styles.content}>
        <Link className={styles.brand} href={logoHref} aria-label="Schedzo home">
          <Image
            className={`${styles.logo} ${styles.lightLogo}`}
            src="/logo.png"
            alt="Schedzo"
            width={1254}
            height={1254}
            priority
          />
          <Image
            className={`${styles.logo} ${styles.darkLogo}`}
            src="/logo-dark-mode.png"
            alt="Schedzo"
            width={1254}
            height={1254}
            priority
          />
        </Link>
        <div className={styles.controls}>
          <MoneyVisibilityToggle />
          <ThemeToggle />
          {demoMode ? (
              <Link
                  className={styles.exitDemoLink}
                  href="/"
                  aria-label="Exit demo and return to home"
                  title="Return to the landing page"
              >
                <span>Exit demo</span>
              </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
