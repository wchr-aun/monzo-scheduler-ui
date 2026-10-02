"use client";

import {useEffect, useId, useState} from "react";
import {useScrollReveal} from "@/lib/animation/use-scroll-reveal";
import {ArrowIcon} from "@/components/ui/icons/arrow-icon";
import {ScheduledTransferCard} from "@/components/scheduled-transfers/scheduled-transfer-card/scheduled-transfer-card";
import type {ScheduledTransfer} from "@/lib/scheduled-transfers/types";
import {MonzoTransaction} from "@/components/landing/monzo-transaction/monzo-transaction";
import revealStyles from "@/components/ui/scroll-reveal/scroll-reveal.module.css";
import styles from "./payment-flow.module.css";

export function PaymentFlow({transfer}: {transfer: ScheduledTransfer}) {
  const {ref, entered, reducedMotion, hidden} = useScrollReveal<HTMLElement>();
  const [step, setStep] = useState(1);
  const [started, setStarted] = useState(false);
  const [playback, setPlayback] = useState(0);
  const [scheduledFor, setScheduledFor] = useState(transfer.scheduled_for);
  const [secondsRemaining, setSecondsRemaining] = useState(2);
  const stepsId = useId();

  useEffect(() => {
    if (entered && !started) {
      setStarted(true);
      setScheduledFor(new Date().toISOString());
      setStep(reducedMotion ? 3 : 1);
    }
  }, [entered, started, reducedMotion]);

  useEffect(() => {
    if (!started || step === 3) return;
    if (reducedMotion) return;
    const countdown = window.setInterval(() => setSecondsRemaining(current => Math.max(0, current - 1)), 1_000);
    const timer = window.setTimeout(() => {
      window.clearInterval(countdown);
      setStep(current => current + 1);
      setSecondsRemaining(3);
    }, 3_000);
    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [started, step, playback, reducedMotion]);

  function replay(fromStep: number) {
    setStarted(true);
    setStep(fromStep);
    setPlayback(current => current + 1);
    setSecondsRemaining(3);
    setScheduledFor(new Date().toISOString());
  }

  const previewTransfer: ScheduledTransfer = {
    ...transfer,
    scheduled_for: scheduledFor,
    status: step === 1 ? "pending" : "completed",
    executed_at: step === 1 ? null : scheduledFor,
  };

  function explanation(forStep: number) {
    const active = step === forStep;
    return (
      <div className={styles.explanation}>
        <p role={active ? "status" : undefined}>
          Step {forStep} of 3 · {forStep === 1 ? (step === 1 ? "Withdrawal executing soon" : "Withdrawal completed") : forStep === 2 ? "Transfer completed · Main balance funded" : "Rent sent to landlord"}
        </p>
        {active && step < 3 && !reducedMotion ? (
          <div className={styles.countdown} aria-live="off">
            <span>{started ? `Next step in ${secondsRemaining}s` : "Plays automatically when in view"}</span>
            {started ? <span className={styles.countdownTrack} aria-hidden="true"><span key={`${step}-${playback}`} /></span> : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <figure ref={ref} className={`${styles.flow} ${revealStyles.reveal}`} data-hidden={hidden} data-entered={entered}
      aria-label="Example of a pot withdrawal followed by a payment scheduled in Monzo">
      <div className={styles.player}>
        <ol id={stepsId} className={styles.steps}>
          <li>
            <p className={styles.stepLabel}>Schedzo · Pot withdrawal</p>
            <fieldset className={styles.transferPreview} disabled inert aria-label="Example scheduled withdrawal">
              <ul>
                <ScheduledTransferCard transfer={previewTransfer} cancelling={false} onCancel={() => undefined} />
              </ul>
            </fieldset>
            {explanation(1)}
            {step >= 2 ? <div className={styles.arrow} aria-hidden="true"><ArrowIcon direction="down" /></div> : null}
          </li>
          {step >= 2 ? <li>
            <p className={styles.stepLabel}>Schedzo · Transfer update</p>
            <MonzoTransaction key={`transfer-${playback}`} revealTrigger="mount" kind="transfer" amount={transfer.amount} potName="Rainy day" />
            {explanation(2)}
            {step >= 3 ? <div className={styles.arrow} aria-hidden="true"><ArrowIcon direction="down" /></div> : null}
          </li> : null}
          {step >= 3 ? <li>
            <p className={styles.stepLabel}>Monzo · Scheduled payment</p>
            <MonzoTransaction key={`payment-${playback}`} revealTrigger="mount" kind="payment" amount={transfer.amount} recipient="Landlord" initials="L" reference="Rent" />
            {explanation(3)}
          </li> : null}
        </ol>
        <div className={styles.controls} role="group" aria-label="Replay payment flow">
          {["Withdrawal due soon", "Transfer completed", "Rent sent to landlord"].map((label, index) => (
            <button key={label} type="button" aria-label={`Replay step ${index + 1}: ${label}`}
              aria-pressed={step === index + 1} aria-controls={stepsId}
              onClick={() => replay(index + 1)}>
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      <figcaption>One less thing to remember. <span>Example flow. The payment is scheduled in Monzo.</span></figcaption>
    </figure>
  );
}
