"use client";

import { useConsoleClient } from "@/components/providers/console-client-provider";

import { useToast } from "@/components/providers/toast-provider/toast-provider";

import {Section} from "@/components/layout/section/section";
import {InlineMessage} from "@/components/ui/inline-message/inline-message";
import {LoadingIndicator} from "@/components/ui/loading-indicator/loading-indicator";
import {MultiSelect} from "@/components/ui/multi-select/multi-select";
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
  const { fetchScheduledTransfers, request } = useConsoleClient();
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
  const toast = useToast();
  const [pendingSetupIds, setPendingSetupIds] = useState<Set<string>>(
    () => new Set(),
  );

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

    if (pendingSetupIds.has(transfer.setup_id)) return;
    const toastId = toast.show({ tone: "progress", message: "Cancelling scheduled transfer…" });
    setPendingSetupIds((current) => new Set(current).add(transfer.setup_id));

    try {
      await request(
        `${scheduledTransfersKey}/${encodeURIComponent(transfer.setup_id)}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
        "cancel the scheduled transfer",
      );

      await mutate((key) =>
        isScheduledTransfersKey(key, accountId, potId),
      ).catch((error) => toast.reportError(error, { operation: "load scheduled transfers" }));
      toast.update(toastId, { tone: "success", colour: "info", message: "Scheduled transfer cancelled." });
    } catch (error) {
      toast.reportError(error, { operation: "cancel the scheduled transfer", toastId });
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
