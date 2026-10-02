"use client";

import {Section} from "@/components/layout/section/section";
import {InlineMessage} from "@/components/ui/inline-message/inline-message";
import {LoadingIndicator} from "@/components/ui/loading-indicator/loading-indicator";
import {MultiSelect} from "@/components/ui/multi-select/multi-select";
import {fetchScheduledTransfers} from "@/lib/scheduled-transfers/client";
import {
  getScheduledTransfersKey,
  getScheduledTransfersPageKey,
  isScheduledTransfersKey,
} from "@/lib/scheduled-transfers/keys";
import {
  defaultScheduledTransferStatuses,
  type ScheduledTransfer,
  type ScheduledTransferStatus,
  scheduledTransferStatuses,
} from "@/lib/scheduled-transfers/types";
import {useEffect, useState} from "react";
import useSWR, {useSWRConfig} from "swr";
import {Pagination} from "@/components/scheduled-transfers/pagination/pagination";
import {ScheduledTransferCard} from "@/components/scheduled-transfers/scheduled-transfer-card/scheduled-transfer-card";
import styles from "./scheduled-transfers.module.css";

const statusOptions = scheduledTransferStatuses.map((status) => ({
  label: status,
  value: status,
}));

export function ScheduledTransfers({
  accountId,
  potId,
}: {
  accountId: string;
  potId: string;
}) {
  const scheduledTransfersKey = getScheduledTransfersKey(accountId, potId);
  const [offset, setOffset] = useState(0);
  const [selectedStatuses, setSelectedStatuses] = useState<
    ScheduledTransferStatus[]
  >(() => [...defaultScheduledTransferStatuses]);
  const [debouncedStatuses, setDebouncedStatuses] = useState<
    ScheduledTransferStatus[]
  >(() => [...defaultScheduledTransferStatuses]);
  const pageKey = getScheduledTransfersPageKey(
    accountId,
    potId,
    debouncedStatuses,
    offset,
  );
  const { data, error } = useSWR(
    pageKey,
    fetchScheduledTransfers,
  );
  const { mutate } = useSWRConfig();
  const [pendingSetupIds, setPendingSetupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [cancelMessage, setCancelMessage] = useState<
    { kind: "error" | "success"; text: string } | undefined
  >();

  useEffect(() => {
    if (selectedStatuses.join(",") === debouncedStatuses.join(",")) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedStatuses(selectedStatuses);
      setOffset(0);
    }, 1_000);

    return () => window.clearTimeout(timer);
  }, [debouncedStatuses, selectedStatuses]);

  async function cancelTransfer(transfer: ScheduledTransfer) {
    if (transfer.status !== "pending") {
      return;
    }

    setCancelMessage(undefined);
    setPendingSetupIds((current) => new Set(current).add(transfer.setup_id));

    try {
      const response = await fetch(
        `${scheduledTransfersKey}/${encodeURIComponent(transfer.setup_id)}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Cancel scheduled transfer request failed");
      }

      await mutate((key) =>
        isScheduledTransfersKey(key, accountId, potId),
      ).catch(() => undefined);
      setCancelMessage({
        kind: "success",
        text: "Scheduled transfer cancelled.",
      });
    } catch {
      setCancelMessage({
        kind: "error",
        text: "Could not cancel the scheduled transfer.",
      });
    } finally {
      setPendingSetupIds((current) => {
        const next = new Set(current);
        next.delete(transfer.setup_id);
        return next;
      });
    }
  }

  return (
    <Section
      action={
        <MultiSelect
          label="Status"
          minimumSelections={1}
          onChange={setSelectedStatuses}
          options={statusOptions}
          values={selectedStatuses}
        />
      }
      heading="Scheduled transfers"
      headingId="transfers-heading"
    >
      {cancelMessage ? (
        <InlineMessage tone={cancelMessage.kind}>{cancelMessage.text}</InlineMessage>
      ) : null}
      {error ? (
        <InlineMessage tone="error">Could not load scheduled transfers.</InlineMessage>
      ) : null}
      {!data && !error ? (
        <LoadingIndicator label="Loading scheduled transfers" />
      ) : !data ? null : data.scheduledTransfers.length === 0 ? (
        <InlineMessage>No scheduled transfers found.</InlineMessage>
      ) : (
        <ul className={styles.list}>
          {data.scheduledTransfers.map((transfer) => (
            <ScheduledTransferCard
              cancelling={pendingSetupIds.has(transfer.setup_id)}
              key={transfer.transfer_id}
              onCancel={() => void cancelTransfer(transfer)}
              transfer={transfer}
            />
          ))}
        </ul>
      )}
      {data && data.total > data.limit ? (
        <Pagination
          limit={data.limit}
          offset={data.offset}
          onChange={setOffset}
          total={data.total}
        />
      ) : null}
    </Section>
  );
}
