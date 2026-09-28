import { Suspense } from "react";
import { CallbackStatus } from "./callback-status";

export const dynamic = "force-dynamic";

export default function CallbackPage() {
  return (
    <main className="screen" aria-live="polite">
      <Suspense fallback={<Loading />}>
        <CallbackStatus />
      </Suspense>
    </main>
  );
}

function Loading() {
  return (
    <div className="callback-status" role="status" aria-label="Finishing login">
      <span className="loading-indicator" aria-hidden="true" />
    </div>
  );
}
