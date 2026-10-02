import Link from "next/link";
import styles from "./footer.module.css";

export function Footer({ openLinksInNewTab = false }: { openLinksInNewTab?: boolean }) {
  return (
    <footer className={styles.footer}>
      Copyright @ {new Date().getUTCFullYear()} by{" "}
      <Link
        href="https://github.com/wchr-aun"
        target={openLinksInNewTab ? "_blank" : undefined}
        rel={openLinksInNewTab ? "noopener noreferrer" : undefined}
      >wchr-aun</Link>
    </footer>
  );
}
