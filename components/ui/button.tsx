import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({
  className,
  variant = "secondary",
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
}
