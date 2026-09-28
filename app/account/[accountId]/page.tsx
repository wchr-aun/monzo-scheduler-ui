import Link from "next/link";
import { AccountDetails } from "./account-details";

type AccountPageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { accountId } = await params;

  return (
    <main className="account-screen">
      <div className="account-page">
        <Link className="back-link" href="/">
          ← Back to accounts
        </Link>
        <header>
          <h1>Account</h1>
          <p>{accountId}</p>
        </header>
        <AccountDetails accountId={accountId} />
      </div>
    </main>
  );
}
