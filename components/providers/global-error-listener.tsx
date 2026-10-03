"use client";

import { useEffect } from "react";
import { useToast } from "@/components/providers/toast-provider/toast-provider";
import { AppError } from "@/lib/errors/app-error";

export function GlobalErrorListener() {
  const { reportError } = useToast();
  useEffect(() => {
    if (document.documentElement.dataset.themeStorageUnavailable === "true") {
      delete document.documentElement.dataset.themeStorageUnavailable;
      reportError(new AppError("frontend", "restore browser preferences", "preference_restore_failed"));
    }
    // Resource load failures do not provide an exception; API requests are handled separately.
    const onError = (event: ErrorEvent) => reportError(event.error);
    const onRejection = (event: PromiseRejectionEvent) => reportError(event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [reportError]);
  return null;
}
