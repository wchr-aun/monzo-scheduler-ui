"use client";

import {useEffect, useId, useRef, useState} from "react";
import {ScrollReveal} from "@/components/ui/scroll-reveal/scroll-reveal";
import Image from "next/image";
import styles from "./monzo-notification.module.css";

type MonzoNotificationProps = {
  title: string;
  message?: string;
};

export function MonzoNotification({title, message}: MonzoNotificationProps) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const [playback, setPlayback] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const notificationId = useId();
  const hintId = useId();

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (read) triggerRef.current?.focus();
  }, [open, read]);

  return (
    <ScrollReveal effect="popup">
      <div className={styles.notificationDemo} onKeyDown={event => {
        if (event.key === "Escape" && open) close();
      }}>
        <button ref={triggerRef} className={styles.appButton} type="button" hidden={open}
          aria-label="Open Monzo notification" aria-describedby={hintId}
          aria-controls={notificationId} aria-expanded={open}
          onClick={() => {
            setOpen(true);
            setRead(true);
            setPlayback(current => current + 1);
          }}>
          <Image src="/monzo-logo.png" alt="" width={56} height={56} />
          {!read ? <span className={styles.badge} aria-hidden="true">1</span> : null}
        </button>
        <p id={hintId} className={styles.hint} hidden={open}>{read ? "Click Monzo to replay" : "1 new notification · Click to open"}</p>
        {open ? (
          <div key={playback} id={notificationId} className={styles.notificationCard} role="region" aria-label="Monzo notification">
            <div className={styles.notificationIcon}>
              <Image src="/monzo-logo.png" alt="" width={40} height={40} />
            </div>
            <div className={styles.notificationBody}>
              <div className={styles.notificationHeader}>
                <span>Monzo</span>
                <div className={styles.notificationMeta}>
                  <span>now</span>
                  <button ref={closeRef} type="button" className={styles.closeButton} aria-label="Close Monzo notification" onClick={close}>×</button>
                </div>
              </div>
              <p className={styles.notificationTitle}>{title}</p>
              {message && <p className={styles.notificationMessage}>{message}</p>}
            </div>
          </div>
        ) : null}
      </div>
    </ScrollReveal>
  );
}
