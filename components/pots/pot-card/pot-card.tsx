import { BalanceCard } from "@/components/ui/balance-card/balance-card";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import { Money } from "@/components/ui/money/money";
import type { Pot } from "@/lib/pots/types";
import styles from "./pot-card.module.css";

export function PotCard({ accountId, pot }: { accountId: string; pot: Pot }) {
  const potName = pot.name || "Unnamed pot";

  return (
    <li>
      <BalanceCard
        title={potName}
        href={`/console/account/${encodeURIComponent(accountId)}/pot/${encodeURIComponent(pot.id)}`}
        linkLabel={`View ${potName}`}
        disabled={pot.deleted}
        badge={
          pot.deleted ? <StatusBadge tone="deleted">Deleted</StatusBadge> : null
        }
        balance={
          <div className={styles.balance}>
            <span>Balance</span>
            <strong>
              <Money
                amount={pot.balance}
                currency={pot.currency}
                label={`${pot.name || "pot"} balance`}
              />
            </strong>
          </div>
        }
      />
    </li>
  );
}
