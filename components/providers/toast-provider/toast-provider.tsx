"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastViewport } from "@/components/ui/toast/toast";

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
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const nextId = useRef(0);
  const show = useCallback((content: ToastContent) => {
    const id = `toast-${++nextId.current}`;
    setToasts((current) => [...current, { ...content, colour: notificationColour(content), id, revision: 0 }]);
    return id;
  }, []);
  const update = useCallback((id: string, content: ToastContent) => {
    // A dismissed progress notification stays dismissed when its request finishes.
    setToasts((current) => current.map((toast) => toast.id === id
      ? { ...toast, ...content, colour: notificationColour(content), revision: toast.revision + 1 } : toast));
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const value = useMemo(() => ({ show, update, dismiss }), [show, update, dismiss]);

  return (
    <ToastContext.Provider value={value}>
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
