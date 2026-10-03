"use client";

import {Button} from "@/components/ui/button/button";
import {useToast} from "@/components/providers/toast-provider/toast-provider";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useSWRConfig} from "swr";
import styles from "./logout-button.module.css";

export function LogoutButton() {
  const router = useRouter();
  const { cache, mutate } = useSWRConfig();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const toast = useToast();

  async function logout() {
    setIsLoggingOut(true);
    const toastId = toast.show({ tone: "progress", message: "Logging out…" });

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error(`Logout request failed with status ${response.status}`);
      }

      await mutate(() => true, undefined, { revalidate: false });

      for (const key of Array.from(cache.keys())) {
        cache.delete(key);
      }

      toast.update(toastId, { tone: "success", colour: "info", message: "Logged out." });
      router.refresh();
    } catch {
      toast.update(toastId, { tone: "error", message: "Could not log out. Please try again." });
      setIsLoggingOut(false);
    }
  }

  return (
    <div className={styles.control}>
      <Button
        className={styles.button}
        variant="danger"
        type="button"
        disabled={isLoggingOut}
        onClick={() => void logout()}
      >
        {isLoggingOut ? "Logging out…" : "Log out"}
      </Button>
    </div>
  );
}
