import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./switch.module.css";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & {
  children: ReactNode;
};

export function Switch({ children, ...props }: SwitchProps) {
  return (
    <label className={styles.control}>
      <input type="checkbox" role="switch" {...props} />
      <span>{children}</span>
    </label>
  );
}
