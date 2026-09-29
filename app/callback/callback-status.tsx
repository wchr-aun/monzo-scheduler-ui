"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "redirecting" | "missing-params" | "request-error";

export function CallbackStatus() {
  const router = useRouter();
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

        setStatus("redirecting");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("request-error");
        }
      }
    }

    void completeLogin();

    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    if (status !== "redirecting") {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      router.replace("/");
    }, 3_000);

    return () => window.clearTimeout(redirectTimer);
  }, [router, status]);

  if (status === "redirecting") {
    return (
      <div className="callback-status" role="status">
        <span className="loading-indicator" aria-hidden="true" />
        <p>Redirecting you back to the homepage…</p>
      </div>
    );
  }

  if (status === "missing-params") {
    return (
      <div className="callback-status">
        <p>Invalid callback: code and state are required.</p>
      </div>
    );
  }

  if (status === "request-error") {
    return (
      <div className="callback-status">
        <p>Could not complete login. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className="callback-status" role="status" aria-label="Finishing login">
      <span className="loading-indicator" aria-hidden="true" />
    </div>
  );
}
