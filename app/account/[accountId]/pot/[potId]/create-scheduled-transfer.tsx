"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { formatMoney } from "../../../../account-data";

function getScheduledTransfersKey(accountId: string, potId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/pots/${encodeURIComponent(potId)}/scheduled-transfers`;
}

const ukDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatInUk(date: Date) {
  const parts = Object.fromEntries(
    ukDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function getEarliestUkDateTime(date: Date) {
  const nextMinute = new Date(Math.ceil(date.getTime() / 60_000) * 60_000);
  return formatInUk(nextMinute);
}

function getUkDateTime(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const expectedLocalValue = value;
  for (const offset of ["+00:00", "+01:00"]) {
    const datetime = `${value}:00${offset}`;
    const instant = new Date(datetime);

    if (
      !Number.isNaN(instant.getTime()) &&
      formatInUk(instant) === expectedLocalValue
    ) {
      return datetime;
    }
  }

  return null;
}

function formatLocalDateTime(datetime: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(datetime));
}

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const datetime = getUkDateTime(String(formData.get("datetime") ?? ""));
    const amountInPence = Number(formData.get("amount"));

    if (!datetime) {
      setMessage({
        kind: "error",
        text: "Enter a valid UK date and time.",
      });
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
      setMessage({
        kind: "error",
        text: "Amount cannot exceed the pot balance.",
      });
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
      setMessage({
        kind: "success",
        text: "Scheduled transfer created.",
      });
      void mutate(getScheduledTransfersKey(accountId, potId)).catch(
        () => undefined,
      );
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
    <section className="detail-section" aria-labelledby="create-transfer-heading">
      <div className="detail-section-heading">
        <h2 id="create-transfer-heading">Schedule a transfer</h2>
        <button
          className="secondary-button"
          type="button"
          aria-expanded={isExpanded}
          aria-controls="scheduled-transfer-form"
          onClick={() => {
            if (isExpanded) {
              setSelectedDateTime("");
              setAmount("");
            } else {
              const now = new Date();
              const earliestDateTime = getEarliestUkDateTime(now);
              const selectedInstant = getUkDateTime(selectedDateTime);

              setMinimumDateTime(earliestDateTime);
              if (
                !selectedInstant ||
                new Date(selectedInstant).getTime() < now.getTime()
              ) {
                setSelectedDateTime(earliestDateTime);
              }
            }
            setIsExpanded((expanded) => !expanded);
            setMessage(undefined);
          }}
        >
          {isExpanded ? "Cancel" : "Create a new scheduled transfer"}
        </button>
      </div>

      {isExpanded ? (
        <form
          className="scheduled-transfer-form"
          id="scheduled-transfer-form"
          onSubmit={handleSubmit}
        >
          <div className="scheduled-transfer-field">
            <label htmlFor="scheduled-transfer-datetime">
              UK date and time
            </label>
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
              <output className="local-datetime" aria-live="polite">
                Local date and time:{" "}
                <time dateTime={ukDateTime}>
                  {formatLocalDateTime(ukDateTime)}
                </time>
              </output>
            ) : null}
          </div>

          <div className="scheduled-transfer-field">
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

          <div className="scheduled-transfer-field">
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

          <div className="scheduled-transfer-field">
            <label htmlFor="scheduled-transfer-amount">Amount (pence)</label>
            <input
              id="scheduled-transfer-amount"
              name="amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(event) => {
                if (
                  /^\d*$/.test(event.target.value) &&
                  (event.target.value === "" ||
                    Number(event.target.value) <= balance)
                ) {
                  setAmount(event.target.value);
                }
              }}
              aria-describedby="scheduled-transfer-amount-limit"
              required
            />
            <span
              className="field-hint"
              id="scheduled-transfer-amount-limit"
            >
              Maximum: {formatMoney(balance, currency)} (
              {balance.toLocaleString()} pence)
            </span>
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create scheduled transfer"}
          </button>
        </form>
      ) : null}

      {message ? (
        <p
          className={
            message.kind === "error"
              ? "form-message accounts-error"
              : "form-message form-success"
          }
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
