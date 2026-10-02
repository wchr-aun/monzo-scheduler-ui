"use client";

import type {CSSProperties, ReactNode} from "react";
import {useScrollReveal} from "@/lib/animation/use-scroll-reveal";
import styles from "./scroll-reveal.module.css";

export function ScrollReveal({children, className = "", effect = "rise", delay = 0, trigger = "scroll"}: {
  children: ReactNode;
  className?: string;
  effect?: "rise" | "popup";
  delay?: number;
  trigger?: "scroll" | "mount";
}) {
  const {ref, entered, hidden} = useScrollReveal(trigger);
  return (
    <div ref={ref} className={`${styles.reveal} ${className}`} data-effect={effect}
      data-hidden={hidden} data-entered={entered}
      style={{"--reveal-delay": `${delay}ms`} as CSSProperties}>
      {children}
    </div>
  );
}
