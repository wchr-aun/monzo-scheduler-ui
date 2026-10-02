import { PageContainer } from "@/components/layout/page-container/page-container";
import { PotDetails } from "@/components/pots/pot-details/pot-details";
import { ScheduledTransfers } from "@/components/scheduled-transfers/scheduled-transfers/scheduled-transfers";

type PotPageProps = {
  params: Promise<{ accountId: string; potId: string }>;
};

export default async function PotPage({ params }: PotPageProps) {
  const { accountId, potId } = await params;

  return (
    <PageContainer>
      <PotDetails accountId={accountId} potId={potId} />
      <ScheduledTransfers accountId={accountId} potId={potId} />
    </PageContainer>
  );
}
