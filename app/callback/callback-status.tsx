"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "loading" | "done" | "missing-params" | "request-error";

export function CallbackStatus() {
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

        setStatus("done");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("request-error");
        }
      }
    }

    void completeLogin();

    return () => controller.abort();
  }, [searchParams]);

  if (status === "done") {
    return (
      <div className="callback-status">
        <span className="success" aria-hidden="true">✓</span>
        <p>Done. You can now close this window.</p>
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
    <div className="callback-status">
      <span className="spinner" aria-hidden="true" />
      <p>Finishing up…</p>
    </div>
  );
}
