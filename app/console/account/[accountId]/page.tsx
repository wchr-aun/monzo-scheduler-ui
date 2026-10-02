import { PageContainer } from "@/components/layout/page-container/page-container";
import { AccountDetails } from "@/components/accounts/account-details/account-details";
import { getUserId } from "@/lib/auth/session.server";
import { cookies } from "next/headers";

type AccountPageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { accountId } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(process.env.SESSION_COOKIE_NAME ?? "session")?.value;
  const userId = sessionToken ? getUserId(sessionToken) : null;

  return (
    <PageContainer>
      <AccountDetails accountId={accountId} userId={userId} />
    </PageContainer>
  );
}
