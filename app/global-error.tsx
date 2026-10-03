"use client";

import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import { ErrorRecovery } from "@/components/ui/error-recovery/error-recovery";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body>
    <ToastProvider><ErrorRecovery error={error} reset={reset} /></ToastProvider>
  </body></html>;
}
