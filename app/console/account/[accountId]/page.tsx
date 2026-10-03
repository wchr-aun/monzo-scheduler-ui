import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container/page-container";
import { AccountDetails } from "@/components/accounts/account-details/account-details";
import { getUserId } from "@/lib/auth/session.server";
import { getConsoleAccountName, requireConsoleSession } from "@/lib/console/metadata.server";

type AccountPageProps = {
  params: Promise<{ accountId: string }>;
};

export async function generateMetadata({ params }: AccountPageProps): Promise<Metadata> {
  const { accountId } = await params;
  return {
    title: await getConsoleAccountName(accountId),
    description:
      "View your Monzo account balance and pots in Schedzo. Choose a pot to manage its scheduled deposits and withdrawals.",
  };
}

export default async function AccountPage({ params }: AccountPageProps) {
  const sessionToken = await requireConsoleSession();
  const { accountId } = await params;
  const userId = getUserId(sessionToken);

  return (
    <PageContainer>
      <AccountDetails accountId={accountId} userId={userId} />
    </PageContainer>
  );
}
