import Link from "next/link";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      Copyright @ {new Date().getUTCFullYear()} by{" "}
      <Link href="https://github.com/wchr-aun">wchr-aun</Link>
    </footer>
  );
}
