"use client";

import { FormEvent, useState } from "react";
import { useSWRConfig } from "swr";

function getScheduledTransfersKey(accountId: string, potId: string) {
  return `/api/accounts/${encodeURIComponent(accountId)}/pots/${encodeURIComponent(potId)}/scheduled-transfers`;
}

function getUkDateTime(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const expectedLocalValue = value;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  function formatInUk(timestamp: number) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(timestamp))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );

    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  for (const offset of ["+00:00", "+01:00"]) {
    const datetime = `${value}:00${offset}`;
    const instant = new Date(datetime);

    if (
      !Number.isNaN(instant.getTime()) &&
      formatInUk(instant.getTime()) === expectedLocalValue
    ) {
      return datetime;
    }
  }

  return null;
}

export function CreateScheduledTransfer({
  accountId,
  potId,
}: {
  accountId: string;
  potId: string;
}) {
  const { mutate } = useSWRConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<
    { kind: "error" | "success"; text: string } | undefined
  >();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const datetime = getUkDateTime(String(formData.get("datetime") ?? ""));
    const amount = Number(formData.get("amount"));

    if (!datetime) {
      setMessage({
        kind: "error",
        text: "Enter a valid UK date and time.",
      });
      return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setMessage({
        kind: "error",
        text: "Amount must be a positive whole number of pence.",
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
          amount,
          pot_id: potId,
          account_id: accountId,
        }),
      });

      if (!response.ok) {
        throw new Error("Schedule transfer request failed");
      }

      form.reset();
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
          <label>
            <span>UK date and time</span>
            <input name="datetime" type="datetime-local" step="60" required />
          </label>

          <label>
            <span>Interval</span>
            <select name="interval" defaultValue="monthly" required>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <label>
            <span>Transfer type</span>
            <select name="type" defaultValue="deposit" required>
              <option value="deposit">Deposit into pot</option>
              <option value="withdraw">Withdraw from pot</option>
            </select>
          </label>

          <label>
            <span>Amount (pence)</span>
            <input name="amount" type="number" min="1" step="1" required />
          </label>

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
