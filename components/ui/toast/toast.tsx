"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { ToastNotification } from "@/components/providers/toast-provider/toast-provider";
import styles from "./toast.module.css";

export function ToastViewport({ toasts, dismiss }: {
  toasts: ToastNotification[];
  dismiss: (id: string) => void;
}) {
  return (
    <section className={styles.viewport} aria-label="Notifications">
      {toasts.map((toast) => <Toast key={toast.id} toast={toast} dismiss={() => dismiss(toast.id)} />)}
    </section>
  );
}

function Toast({ toast, dismiss }: { toast: ToastNotification; dismiss: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const gesture = useRef<{ id: number; x: number; y: number; time: number; horizontal: boolean } | null>(null);
  const remaining = useRef(5_000);
  const [timeLeft, setTimeLeft] = useState(5_000);
  const onDismiss = useRef(dismiss);
  onDismiss.current = dismiss;

  useEffect(() => {
    remaining.current = 5_000;
    setTimeLeft(5_000);
  }, [toast.revision]);
  useEffect(() => {
    if (toast.tone !== "success" || hovered || focused || dragging) return;
    const started = Date.now();
    const duration = remaining.current;
    const countdown = window.setInterval(() => {
      setTimeLeft(Math.max(0, duration - (Date.now() - started)));
    }, 100);
    const timer = window.setTimeout(() => onDismiss.current(), remaining.current);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(countdown);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
      setTimeLeft(remaining.current);
    };
  }, [toast.tone, toast.revision, hovered, focused, dragging]);

  function finish(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = gesture.current;
    if (!start || event.pointerId !== start.id) return;
    const distance = event.clientX - start.x;
    const elapsed = Math.max(1, performance.now() - start.time);
    if (!cancelled && start.horizontal && (Math.abs(distance) >= 80 || (Math.abs(distance) >= 30 && Math.abs(distance) / elapsed > 0.6))) {
      onDismiss.current();
    }
    gesture.current = null;
    setDragging(false);
    setOffset(0);
  }

  return (
    <div
      className={`${styles.toast} ${styles[toast.colour]}`}
      style={{ transform: `translateX(${offset}px)`, opacity: Math.max(0.35, 1 - Math.abs(offset) / 300) }}
      data-dragging={dragging}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onDismiss.current(); } }}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), horizontal: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const start = gesture.current;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!start.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          finish(event, true);
          return;
        }
        if (Math.abs(dx) > 8) start.horizontal = true;
        if (start.horizontal) setOffset(dx);
      }}
      onPointerUp={(event) => finish(event)}
      onPointerCancel={(event) => finish(event, true)}
      onLostPointerCapture={(event) => finish(event, true)}
    >
      <p className={styles.message} role={toast.tone === "error" ? "alert" : "status"} aria-atomic="true">{toast.message}</p>
      <button className={styles.close} type="button" aria-label={`Dismiss notification: ${toast.message}`} onClick={dismiss}>Dismiss</button>
      {toast.tone === "success" ? (
        <div className={styles.countdown} role="progressbar" aria-label="Time until notification dismisses"
          data-paused={hovered || focused || dragging}
          aria-valuemin={0} aria-valuemax={5} aria-valuenow={Math.ceil(timeLeft / 100) / 10}
          aria-valuetext={`${Math.ceil(timeLeft / 1_000)} seconds remaining${hovered || focused || dragging ? ", paused" : ""}`}>
          <div className={styles.countdownFill} style={{ width: `${timeLeft / 50}%` }} />
        </div>
      ) : null}
    </div>
  );
}
