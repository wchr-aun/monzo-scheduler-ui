"use client";

import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { InlineMessage } from "@/components/ui/inline-message";
import { formatMoney } from "@/lib/formatting/money";
import {
  formatLocalDateTime,
  getEarliestUkDateTime,
  getUkDateTime,
} from "@/lib/scheduled-transfers/date-time";
import {
  getScheduledTransfersKey,
  isScheduledTransfersKey,
} from "@/lib/scheduled-transfers/keys";
import { type FormEvent, useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import styles from "./create-scheduled-transfer.module.css";

export function CreateScheduledTransfer({
  accountId,
  potId,
  balance,
  currency,
}: {
  accountId: string;
  potId: string;
  balance: number;
  currency: string;
}) {
  const { mutate } = useSWRConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [minimumDateTime, setMinimumDateTime] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<
    { kind: "error" | "success"; text: string } | undefined
  >();

  useEffect(() => {
    const earliestDateTime = getEarliestUkDateTime(new Date());
    setMinimumDateTime(earliestDateTime);
    setSelectedDateTime(earliestDateTime);
  }, []);

  function toggleForm() {
    if (isExpanded) {
      setSelectedDateTime("");
      setAmount("");
    } else {
      const now = new Date();
      const earliestDateTime = getEarliestUkDateTime(now);
      const selectedInstant = getUkDateTime(selectedDateTime);

      setMinimumDateTime(earliestDateTime);
      if (!selectedInstant || new Date(selectedInstant).getTime() < now.getTime()) {
        setSelectedDateTime(earliestDateTime);
      }
    }

    setIsExpanded((expanded) => !expanded);
    setMessage(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const datetime = getUkDateTime(String(formData.get("datetime") ?? ""));
    const amountInPence = Number(formData.get("amount"));

    if (!datetime) {
      setMessage({ kind: "error", text: "Enter a valid UK date and time." });
      return;
    }

    if (new Date(datetime).getTime() < Date.now()) {
      setMessage({
        kind: "error",
        text: "Date and time must not be in the past.",
      });
      return;
    }

    if (!Number.isSafeInteger(amountInPence) || amountInPence <= 0) {
      setMessage({
        kind: "error",
        text: "Amount must be a positive whole number of pence.",
      });
      return;
    }

    if (amountInPence > balance) {
      setMessage({ kind: "error", text: "Amount cannot exceed the pot balance." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(getScheduledTransfersKey(accountId, potId), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datetime,
          interval: formData.get("interval"),
          type: formData.get("type"),
          amount: amountInPence,
          pot_id: potId,
          account_id: accountId,
        }),
      });

      if (!response.ok) {
        throw new Error("Schedule transfer request failed");
      }

      form.reset();
      setSelectedDateTime("");
      setAmount("");
      setIsExpanded(false);
      setMessage({ kind: "success", text: "Scheduled transfer created." });
      await mutate((key) =>
        isScheduledTransfersKey(key, accountId, potId),
      ).catch(() => undefined);
    } catch {
      setMessage({
        kind: "error",
        text: "Could not create the scheduled transfer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const ukDateTime = getUkDateTime(selectedDateTime);

  return (
    <Section
      heading="Schedule a transfer"
      headingId="create-transfer-heading"
      action={
        <Button
          type="button"
          aria-expanded={isExpanded}
          aria-controls="scheduled-transfer-form"
          onClick={toggleForm}
        >
          {isExpanded ? "Cancel" : "Create a new scheduled transfer"}
        </Button>
      }
    >
      {isExpanded ? (
        <form
          className={styles.form}
          id="scheduled-transfer-form"
          onSubmit={handleSubmit}
        >
          <div className={styles.field}>
            <label htmlFor="scheduled-transfer-datetime">UK date and time</label>
            <input
              id="scheduled-transfer-datetime"
              name="datetime"
              type="datetime-local"
              step="60"
              min={minimumDateTime}
              value={selectedDateTime}
              onChange={(event) => setSelectedDateTime(event.target.value)}
              required
            />
            {ukDateTime ? (
              <output className={styles.hint} aria-live="polite">
                Local date and time:{" "}
                <time dateTime={ukDateTime}>{formatLocalDateTime(ukDateTime)}</time>
              </output>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="scheduled-transfer-interval">Interval</label>
            <select
              id="scheduled-transfer-interval"
              name="interval"
              defaultValue="monthly"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="scheduled-transfer-type">Transfer type</label>
            <select
              id="scheduled-transfer-type"
              name="type"
              defaultValue="deposit"
              required
            >
              <option value="deposit">Deposit into pot</option>
              <option value="withdraw">Withdraw from pot</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="scheduled-transfer-amount">Amount (pence)</label>
            <input
              id="scheduled-transfer-amount"
              name="amount"
              type="text"
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(event) => {
                if (
                  /^\d*$/.test(event.target.value) &&
                  (event.target.value === "" || Number(event.target.value) <= balance)
                ) {
                  setAmount(event.target.value);
                }
              }}
              aria-describedby="scheduled-transfer-amount-limit"
              required
            />
            <span className={styles.hint} id="scheduled-transfer-amount-limit">
              Maximum: {formatMoney(balance, currency)} ({balance.toLocaleString()}{" "}
              pence)
            </span>
          </div>

          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create scheduled transfer"}
          </Button>
        </form>
      ) : null}

      {message ? (
        <InlineMessage tone={message.kind}>{message.text}</InlineMessage>
      ) : null}
    </Section>
  );
}
