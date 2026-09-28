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
    <div className="callback-status">
      <span className="spinner" aria-hidden="true" />
      <p>Finishing up…</p>
    </div>
  );
}
