"use client";

import {useMemo} from "react";
import {Navbar} from "@/components/layout/navbar";
import {SWRConfig} from "swr";
import {ScheduledTransfers} from "@/components/scheduled-transfers/scheduled-transfers";
import {getScheduledTransfersPageKey} from "@/lib/scheduled-transfers/keys";
import {defaultScheduledTransferStatuses} from "@/lib/scheduled-transfers/types";
import type {ScheduledTransfersPage} from "@/lib/scheduled-transfers/types";
import {PotDetails} from "@/components/accounts/pot-details";
import {getPotsKey} from "@/lib/pots/keys";
import {previewAccountId, previewPot} from "@/lib/pots/preview";
import styles from "./pot-preview.module.css";

export function PotPreview({transfersPage}: {transfersPage: ScheduledTransfersPage}) {
  const previewDataConfig = useMemo(() => ({
    provider: () => new Map(),
    fallback: {
      [getPotsKey(previewAccountId)]: [previewPot],
      [getScheduledTransfersPageKey(previewAccountId, previewPot.id, defaultScheduledTransferStatuses, 0)]: transfersPage,
    },
    revalidateOnMount: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  }), [transfersPage]);
  return (
    <figure className={styles.preview} aria-label="Example pot page with a balance and scheduled transfers">
      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.phone}>
        <div className={styles.statusBar} aria-hidden="true">
          <span>9:41</span><span className={styles.camera} /><span>▴ ▰</span>
        </div>
        <div className={styles.viewport}>
          <fieldset disabled inert aria-label="Pot page preview" className={styles.app}>
            <div className={styles.appBar}>
              <Navbar logoHref="/" />
            </div>
            <div className={styles.screen}>
              <SWRConfig value={previewDataConfig}>
                <div className={styles.potDetails}>
                  <PotDetails accountId={previewAccountId} potId={previewPot.id} />
                </div>
                <div className={styles.scheduledTransfers}>
                  <ScheduledTransfers accountId={previewAccountId} potId={previewPot.id} />
                </div>
              </SWRConfig>
            </div>
          </fieldset>
        </div>
        <div className={styles.homeIndicator} aria-hidden="true" />
      </div>
      <figcaption className={styles.caption}><span className={styles.captionDot} /> Your plans, at a glance. <span>Example data</span></figcaption>
    </figure>
  );
}
