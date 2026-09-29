import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AccountDetails } from "@/components/accounts/account-details";

type AccountPageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { accountId } = await params;

  return (
    <PageContainer>
      <PageHeader
        backHref="/"
        backLabel="Back to accounts"
        subtitle={accountId}
        title="Account"
      />
      <AccountDetails accountId={accountId} />
    </PageContainer>
  );
}
