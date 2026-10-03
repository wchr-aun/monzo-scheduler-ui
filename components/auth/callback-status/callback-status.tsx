"use client";

import { useToast } from "@/components/providers/toast-provider/toast-provider";
import { LoadingIndicator } from "@/components/ui/loading-indicator/loading-indicator";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./callback-status.module.css";

type Status = "loading" | "redirecting" | "missing-params" | "request-error";

export function CallbackStatus() {
  const router = useRouter();
  const { show } = useToast();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function completeLogin() {
      const code = searchParams.get("code")?.trim();
      const state = searchParams.get("state")?.trim();

      if (!code || !state) {
        setStatus("missing-params");
        return;
      }

      try {
        const params = new URLSearchParams({ code, state });

        const response = await fetch(`/api/auth/callback?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Callback failed with status ${response.status}`);
        }

        if (controller.signal.aborted) return;
        show({ tone: "success", message: "Logged in successfully." });
        setStatus("redirecting");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("request-error");
        }
      }
    }

    void completeLogin();

    return () => controller.abort();
  }, [searchParams, show]);

  useEffect(() => {
    if (status !== "redirecting") {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      router.replace("/console");
    }, 3_000);

    return () => window.clearTimeout(redirectTimer);
  }, [router, status]);

  if (status === "redirecting") {
    return (
      <div className={styles.status} role="status">
        <LoadingIndicator />
        <p>Redirecting you to the console…</p>
      </div>
    );
  }

  if (status === "missing-params") {
    return (
      <div className={styles.status}>
        <p>Invalid callback: code and state are required.</p>
      </div>
    );
  }

  if (status === "request-error") {
    return (
      <div className={styles.status}>
        <p>Could not complete login. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className={styles.status} role="status" aria-label="Finishing login">
      <LoadingIndicator />
    </div>
  );
}
