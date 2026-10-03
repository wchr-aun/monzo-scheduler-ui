"use client";

import { useConsoleClient } from "@/components/providers/console-client-provider";

import { Section } from "@/components/layout/section/section";
import { InlineMessage } from "@/components/ui/inline-message/inline-message";
import { LoadingIndicator } from "@/components/ui/loading-indicator/loading-indicator";
import { Switch } from "@/components/ui/switch/switch";
import { getPotsKey } from "@/lib/pots/keys";
import { useState } from "react";
import useSWR from "swr";
import { PotCard } from "@/components/pots/pot-card/pot-card";
import styles from "./pots-list.module.css";

export function PotsList({ accountId }: { accountId: string }) {
  const { fetchPots } = useConsoleClient();
  const { data: pots, error, isLoading } = useSWR(
    getPotsKey(accountId),
    fetchPots,
  );
  const [hideDeletedPots, setHideDeletedPots] = useState(true);
  const visiblePots = pots?.filter((pot) => !hideDeletedPots || !pot.deleted) ?? [];

  return (
    <Section
      heading="Pots"
      headingId="pots-heading"
      action={
        <div className={styles.action}>
          <Switch
            checked={hideDeletedPots}
            onChange={(event) => setHideDeletedPots(event.target.checked)}
          >
            Hide deleted pots
          </Switch>
        </div>
      }
    >
      {isLoading || (!pots && !error) ? (
        <LoadingIndicator label="Loading pots" />
      ) : error || !pots ? (
        <InlineMessage tone="error">Could not load pots.</InlineMessage>
      ) : visiblePots.length === 0 ? (
        <InlineMessage>
          {hideDeletedPots && pots.length > 0
            ? "No active pots found."
            : "No pots found."}
        </InlineMessage>
      ) : (
        <ul className={styles.list}>
          {visiblePots.map((pot) => (
            <PotCard accountId={accountId} key={pot.id} pot={pot} />
          ))}
        </ul>
      )}
    </Section>
  );
}
