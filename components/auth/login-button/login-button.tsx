"use client";

import { useState, type MouseEvent } from "react";
import { useToast } from "@/components/providers/toast-provider/toast-provider";
import { AppError } from "@/lib/errors/app-error";
import { request, readJson } from "@/lib/errors/request";
import Image from "next/image";
import styles from "./login-button.module.css";

export function LoginButton({ href, onLogin }: { href: string; onLogin?: () => void }) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function login(event: MouseEvent<HTMLAnchorElement>) {
    if (onLogin) {
      event.preventDefault();
      onLogin();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const toastId = toast.show({ tone: "progress", message: "Starting login…" });
    try {
      const response = await request(`${href}?format=json`, { headers: { Accept: "application/json" } }, "start login", false);
      const payload = await readJson(response, "start login");
      if (typeof payload !== "object" || payload === null || !("url" in payload) || typeof payload.url !== "string") {
        throw new AppError("backend", "start login", "invalid_login_redirect_response");
      }
      let url: URL;
      try { url = new URL(payload.url); } catch { throw new AppError("backend", "start login", "invalid_login_redirect_response"); }
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new AppError("backend", "start login", "invalid_login_redirect_response");
      window.location.assign(url.href);
      toast.dismiss(toastId);
    } catch (error) {
      toast.reportError(error, { operation: "start login", toastId });
      setPending(false);
    }
  }

  return (
    <a className={styles.button} href={href} onClick={login} aria-disabled={pending}>
      <Image
        className={styles.logo}
        src="/monzo-logo.png"
        alt=""
        width={30}
        height={30}
      />
      <span>Login with Monzo</span>
    </a>
  );
}
