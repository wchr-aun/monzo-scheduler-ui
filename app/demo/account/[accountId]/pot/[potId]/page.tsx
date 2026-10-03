import { DemoGate } from "@/components/demo/demo-session/demo-session";
import { PotDetails } from "@/components/pots/pot-details/pot-details";
import { ScheduledTransfers } from "@/components/scheduled-transfers/scheduled-transfers/scheduled-transfers";
import { PageContainer } from "@/components/layout/page-container/page-container";

export default async function DemoPotPage({ params }: { params: Promise<{ accountId: string; potId: string }> }) {
  const { accountId, potId } = await params;
  return (
    <DemoGate><PageContainer>
      <PotDetails accountId={accountId} potId={potId} />
      <ScheduledTransfers accountId={accountId} potId={potId} />
    </PageContainer></DemoGate>
  );
}
