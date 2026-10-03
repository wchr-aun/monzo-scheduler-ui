"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastViewport } from "@/components/ui/toast/toast";
import { isAborted, normaliseError, type ErrorOperation } from "@/lib/errors/app-error";
import { GlobalErrorListener } from "@/components/providers/global-error-listener";

export type ToastTone = "progress" | "success" | "error";
export type ToastColour = "primary" | "info" | "danger";
export type ToastNotification = { id: string; message: string; tone: ToastTone; colour: ToastColour; revision: number };
type ToastContent = Pick<ToastNotification, "message" | "tone"> & { colour?: ToastColour };

function notificationColour(content: ToastContent): ToastColour {
  return content.colour ?? (content.tone === "error" ? "danger" : content.tone === "success" ? "primary" : "info");
}
type ToastContextValue = {
  show: (content: ToastContent) => string;
  update: (id: string, content: ToastContent) => void;
  dismiss: (id: string) => void;
  reportError: (error: unknown, options?: { operation?: ErrorOperation; toastId?: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const nextId = useRef(0);
  const reportedErrors = useRef(new WeakSet<Error>());
  const recentErrors = useRef(new Map<string, number>());
  const show = useCallback((content: ToastContent) => {
    const id = `toast-${++nextId.current}`;
    setToasts((current) => [...current, { ...content, colour: notificationColour(content), id, revision: 0 }]);
    return id;
  }, []);
  const update = useCallback((id: string, content: ToastContent) => {
    setToasts((current) => {
      if (!current.some((toast) => toast.id === id)) {
        // Success stays dismissed, but a later failure must still reach the user.
        return content.tone === "error"
          ? [...current, { ...content, colour: notificationColour(content), id, revision: 0 }]
          : current;
      }
      return current.map((toast) => toast.id === id
        ? { ...toast, ...content, colour: notificationColour(content), revision: toast.revision + 1 } : toast);
    });
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const reportError = useCallback((error: unknown, options?: { operation?: ErrorOperation; toastId?: string }) => {
    if (isAborted(error)) return;
    const normalised = normaliseError(error, options?.operation);
    if (normalised.code === "monzo_approval_required" && normalised.status === 403) return;
    const content: ToastContent = { tone: "error", colour: "danger", message: normalised.message };
    const fingerprint = `${normalised.source}:${normalised.message}`;
    const now = Date.now();
    if (options?.toastId) {
      update(options.toastId, content);
    } else {
      if (error instanceof Error && reportedErrors.current.has(error)) return;
      const lastReported = recentErrors.current.get(fingerprint);
      if (lastReported !== undefined && now - lastReported < 10_000) return;
      show(content);
    }
    if (error instanceof Error) reportedErrors.current.add(error);
    recentErrors.current.set(fingerprint, now);
    // Bound bookkeeping even when many unrelated requests fail over a long session.
    if (recentErrors.current.size > 100) {
      const oldest = recentErrors.current.keys().next().value;
      if (oldest !== undefined) recentErrors.current.delete(oldest);
    }
  }, [show, update]);
  const value = useMemo(() => ({ show, update, dismiss, reportError }), [show, update, dismiss, reportError]);

  return (
    <ToastContext.Provider value={value}>
      <GlobalErrorListener />
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
