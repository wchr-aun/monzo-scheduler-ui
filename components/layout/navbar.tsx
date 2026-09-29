import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "./navbar.module.css";

export function Navbar() {
  return (
    <nav className={styles.navbar} aria-label="Site controls">
      <div className={styles.content}>
        <ThemeToggle />
      </div>
    </nav>
  );
}
