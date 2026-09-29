import Image from "next/image";
import styles from "./login-button.module.css";

export function LoginButton({ href }: { href: string }) {
  return (
    <a className={styles.button} href={href}>
      <Image
        className={styles.logo}
        src="/monzo-logo.png"
        alt=""
        width={30}
        height={30}
      />
      <span>Login with Monzo</span>
    </a>
  );
}
