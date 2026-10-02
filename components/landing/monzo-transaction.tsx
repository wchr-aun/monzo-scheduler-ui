import Image from "next/image";
import {ArrowIcon} from "@/components/ui/icons/arrow-icon";
import {MoreVerticalIcon} from "@/components/ui/icons/more-vertical-icon";
import {formatMoneyParts} from "@/lib/formatting/money";
import styles from "./monzo-transaction.module.css";

type MonzoTransactionProps = {
  kind: "transfer";
  amount: number;
  potName: string;
} | {
  kind: "payment";
  amount: number;
  recipient: string;
  initials: string;
  reference: string;
} | {
  kind: "declined";
  amount: number;
  recipient: string;
  initials: string;
};

export function MonzoTransaction(props: MonzoTransactionProps) {
  const parts = formatMoneyParts(props.amount, "GBP");
  const amount = parts.map(part => part.value).join("");
  const declinedAmount = props.amount % 100 === 0
    ? parts.filter(part => part.type !== "decimal" && part.type !== "fraction").map(part => part.value).join("")
    : amount;

  return (
    <div className={styles.row}>
      {props.kind === "transfer" ? (
        <div className={styles.appIcon}>
          <Image src="/logo.png" alt="" width={44} height={44} />
        </div>
      ) : (
        <div className={styles.avatar} aria-hidden="true">{props.initials}</div>
      )}
      <div className={styles.details}>
        {props.kind === "transfer" ? (
          <>
            <p className={styles.title}><span aria-hidden="true">🎉 </span>{amount} withdrawn</p>
            <p className={styles.description}>{props.potName} <ArrowIcon /> Main balance</p>
          </>
        ) : (
          <>
            <p className={styles.title}>{props.recipient}</p>
            {props.kind === "declined" ? (
              <p className={`${styles.description} ${styles.declinedDescription}`}>
                Declined, you didn&apos;t have {declinedAmount}
              </p>
            ) : <p className={styles.description}>{props.reference}</p>}
          </>
        )}
      </div>
      {props.kind !== "payment" ? (
        <MoreVerticalIcon className={styles.menu} />
      ) : (
        <span className={styles.amount} aria-label={`${amount} sent`}>
          {parts.filter(part => part.type !== "currency" && part.type !== "literal").map((part, index) => (
            <span className={part.type === "decimal" || part.type === "fraction" ? styles.decimals : undefined} key={index}>
              {part.value}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
