import { ExternalLink } from "@/components/ui/external-link/external-link";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      Copyright @ {new Date().getUTCFullYear()} by{" "}
      <ExternalLink href="https://github.com/wchr-aun">wchr-aun</ExternalLink>
    </footer>
  );
}
