"use client";

import { useConsoleClient } from "@/components/providers/console-client-provider";

import { useState } from "react";
import Link from "next/link";
import { OutlineIcon } from "@/components/ui/icons/outline-icon";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import { Money } from "@/components/ui/money/money";
import type { Pot } from "@/lib/pots/types";
import { getPotCoverImageUrl } from "@/lib/pots/cover-image";
import { formatPotType } from "@/lib/pots/format-type";
import styles from "./pot-card.module.css";

export function PotCard({ accountId, pot }: { accountId: string; pot: Pot }) {
  const { basePath } = useConsoleClient();
  const potName = pot.name || "Unnamed pot";
  const potType = formatPotType(pot.type);
  const title = potType ? `${potName} - ${potType}` : potName;
  const coverImageUrl = getPotCoverImageUrl(pot.cover_image_url);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  return (
    <li>
      <div
        className={`${styles.card}${pot.deleted ? ` ${styles.disabled}` : ""}`}
        aria-disabled={pot.deleted ? "true" : undefined}
      >
        {!pot.deleted ? (
          <Link
            className={styles.link}
            href={`${basePath}/account/${encodeURIComponent(accountId)}/pot/${encodeURIComponent(pot.id)}`}
            aria-label={`View ${potName}`}
          />
        ) : null}
        <div className={styles.content}>
          {coverImageUrl && failedImageUrl !== coverImageUrl ? (
            <img
              className={styles.cover}
              src={coverImageUrl}
              alt=""
              width={52}
              height={52}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailedImageUrl(coverImageUrl)}
            />
          ) : null}
          <div className={styles.text}>
            <div className={styles.balance}>
              <strong>
                <Money
                  amount={pot.balance}
                  currency={pot.currency}
                  label={`${pot.name || "pot"} balance`}
                />
              </strong>
            </div>
            <div className={styles.heading}>
              <h3>{title}</h3>
              {pot.deleted ? <StatusBadge tone="deleted">Deleted</StatusBadge> : null}
            </div>
          </div>
          {!pot.deleted ? (
            <span className={styles.next}>
              <OutlineIcon>
                <path d="m9 6 6 6-6 6" />
              </OutlineIcon>
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
