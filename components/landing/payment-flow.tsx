"use client";

import {ArrowIcon} from "@/components/ui/icons/arrow-icon";
import {ScheduledTransferCard} from "@/components/scheduled-transfers/scheduled-transfer-card";
import type {ScheduledTransfer} from "@/lib/scheduled-transfers/types";
import {MonzoTransaction} from "./monzo-transaction";
import styles from "./payment-flow.module.css";

export function PaymentFlow({transfer}: {transfer: ScheduledTransfer}) {
  return (
    <figure className={styles.flow} aria-label="Example of a pot withdrawal followed by a payment scheduled in Monzo">
      <ol className={styles.steps}>
        <li>
          <p className={styles.stepLabel}>Schedzo · Pot withdrawal</p>
          <fieldset className={styles.transferPreview} disabled inert aria-label="Example scheduled withdrawal">
            <ul>
              <ScheduledTransferCard transfer={transfer} cancelling={false} onCancel={() => undefined} />
            </ul>
          </fieldset>
          <div className={styles.arrow} aria-hidden="true"><ArrowIcon direction="down" /></div>
        </li>
        <li>
          <p className={styles.stepLabel}>Schedzo · Transfer update</p>
          <MonzoTransaction kind="transfer" amount={transfer.amount} potName="Rainy day" />
          <div className={styles.arrow} aria-hidden="true"><ArrowIcon direction="down" /></div>
        </li>
        <li>
          <p className={styles.stepLabel}>Monzo · Scheduled payment</p>
          <MonzoTransaction kind="payment" amount={transfer.amount} recipient="Landlord" initials="L" reference="Rent" />
        </li>
      </ol>
      <figcaption>One less thing to remember. <span>Example flow. The payment is scheduled in Monzo.</span></figcaption>
    </figure>
  );
}
