import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PotDetails } from "@/components/accounts/pot-details";
import { ScheduledTransfers } from "@/components/scheduled-transfers/scheduled-transfers";

type PotPageProps = {
  params: Promise<{ accountId: string; potId: string }>;
};

export default async function PotPage({ params }: PotPageProps) {
  const { accountId, potId } = await params;

  return (
    <PageContainer>
      <PageHeader
        backHref={`/account/${encodeURIComponent(accountId)}`}
        backLabel="Back to account"
        subtitle={potId}
        title="Pot"
      />
      <PotDetails accountId={accountId} potId={potId} />
      <ScheduledTransfers accountId={accountId} potId={potId} />
    </PageContainer>
  );
}
