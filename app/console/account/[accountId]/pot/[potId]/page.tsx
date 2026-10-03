import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container/page-container";
import { PotDetails } from "@/components/pots/pot-details/pot-details";
import { ScheduledTransfers } from "@/components/scheduled-transfers/scheduled-transfers/scheduled-transfers";
import { getConsolePotName, requireConsoleSession } from "@/lib/console/metadata.server";

type PotPageProps = {
  params: Promise<{ accountId: string; potId: string }>;
};

export async function generateMetadata({ params }: PotPageProps): Promise<Metadata> {
  const { accountId, potId } = await params;
  return {
    title: await getConsolePotName(accountId, potId),
    description:
      "View your Monzo pot balance and manage scheduled transfers in Schedzo. Filter upcoming transfers, create deposits and withdrawals, or cancel a schedule.",
  };
}

export default async function PotPage({ params }: PotPageProps) {
  await requireConsoleSession();
  const { accountId, potId } = await params;

  return (
    <PageContainer>
      <PotDetails accountId={accountId} potId={potId} />
      <ScheduledTransfers accountId={accountId} potId={potId} />
    </PageContainer>
  );
}
