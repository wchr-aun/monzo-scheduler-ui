import Link from "next/link";
import { PotDetails } from "./pot-details";
import { ScheduledTransfers } from "./scheduled-transfers";

type PotPageProps = {
  params: Promise<{ accountId: string; potId: string }>;
};

export default async function PotPage({ params }: PotPageProps) {
  const { accountId, potId } = await params;

  return (
    <main className="account-screen">
      <div className="account-page">
        <Link
          className="back-link"
          href={`/account/${encodeURIComponent(accountId)}`}
        >
          ← Back to account
        </Link>
        <header>
          <h1>Pot</h1>
          <p>{potId}</p>
        </header>
        <PotDetails accountId={accountId} potId={potId} />
        <ScheduledTransfers accountId={accountId} potId={potId} />
      </div>
    </main>
  );
}
