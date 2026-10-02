import { OutlineIcon } from "../outline-icon";
import styles from "./external-link-icon.module.css";

export function ExternalLinkIcon() {
  return (
    <OutlineIcon className={styles.icon}>
      <path d="M15 3h6v6M10 14 21 3" />
      <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
    </OutlineIcon>
  );
}
