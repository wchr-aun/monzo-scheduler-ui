"use client";

import {useEffect, useId, useRef, useState, type CSSProperties} from "react";
import styles from "./interest-calculation.module.css";

export function InterestCalculation() {
  const id = useId();
  const container = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{top: number; left: number} | null>(null);

  function showCalculation() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(280, window.innerWidth - 32);
    setPosition({top: rect.bottom, left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16))});
  }

  useEffect(() => {
    if (!position) return;
    function dismiss() { setPosition(null); }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) dismiss();
    }
    function reposition() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) dismiss();
      else showCalculation();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [position]);

  return (
    <span ref={container} onMouseEnter={showCalculation} onMouseLeave={() => setPosition(null)}>
      <button
        ref={trigger}
        className={styles.trigger}
        type="button"
        aria-describedby={position ? id : undefined}
        onFocus={showCalculation}
        onBlur={() => setPosition(null)}
        onClick={showCalculation}
      >
        £2.87 before tax
      </button>
      {position ? (
        <span
          id={id}
          role="tooltip"
          className={styles.tooltip}
          style={{"--tooltip-top": `${position.top}px`, "--tooltip-left": `${position.left}px`} as CSSProperties}
        >
          <span className={styles.content}>
            <strong>Interest over 17 days</strong>
            <span>£2,273 × ((1 + 0.0275)<sup>17/365</sup> − 1) ≈ £2.87</span>
            <span>Converts 2.75% AER to an equivalent return over 17 days. Illustrative, before tax.</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
