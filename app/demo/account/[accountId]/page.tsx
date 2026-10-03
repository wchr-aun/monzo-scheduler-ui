import { DemoGate } from "@/components/demo/demo-session/demo-session";
import { AccountDetails } from "@/components/accounts/account-details/account-details";
import { PageContainer } from "@/components/layout/page-container/page-container";
import { DEMO_USER_ID } from "@/lib/demo/fixtures";

export default async function DemoAccountPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return <DemoGate><PageContainer><AccountDetails accountId={accountId} userId={DEMO_USER_ID} /></PageContainer></DemoGate>;
}
