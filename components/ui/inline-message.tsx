import type { HTMLAttributes, ReactNode } from "react";
import styles from "./inline-message.module.css";

type InlineMessageProps = Omit<HTMLAttributes<HTMLParagraphElement>, "role"> & {
  children: ReactNode;
  tone?: "neutral" | "success" | "error";
};

export function InlineMessage({
  children,
  className,
  tone = "neutral",
  ...props
}: InlineMessageProps) {
  const classes = [styles.message, styles[tone], className]
    .filter(Boolean)
    .join(" ");

  return (
    <p
      className={classes}
      role={tone === "error" ? "alert" : tone === "success" ? "status" : undefined}
      {...props}
    >
      {children}
    </p>
  );
}
