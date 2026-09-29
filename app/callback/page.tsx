import { CallbackStatus } from "@/components/auth/callback-status";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function CallbackPage() {
  return (
    <PageContainer centered live="polite">
      <Suspense fallback={<Loading />}>
        <CallbackStatus />
      </Suspense>
    </PageContainer>
  );
}

function Loading() {
  return (
    <div role="status" aria-label="Finishing login">
      <LoadingIndicator />
    </div>
  );
}
