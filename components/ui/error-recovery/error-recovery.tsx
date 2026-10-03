"use client";

import { useEffect } from "react";
import { useToast } from "@/components/providers/toast-provider/toast-provider";
import { normaliseError } from "@/lib/errors/app-error";
import { Button } from "@/components/ui/button/button";
import { PageContainer } from "@/components/layout/page-container/page-container";
import styles from "./error-recovery.module.css";

export function ErrorRecovery({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { reportError } = useToast();
  useEffect(() => { reportError(error); }, [error, reportError]);
  return <PageContainer>
    <section className={styles.recovery} aria-label="Page recovery">
      <h1>Something went wrong</h1>
      <p>{normaliseError(error).message}</p>
      <Button type="button" onClick={reset}>Try again</Button>
    </section>
  </PageContainer>;
}
