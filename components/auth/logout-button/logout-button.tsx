"use client";

import {Button} from "@/components/ui/button/button";
import {InlineMessage} from "@/components/ui/inline-message/inline-message";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useSWRConfig} from "swr";
import styles from "./logout-button.module.css";

export function LogoutButton() {
  const router = useRouter();
  const { cache, mutate } = useSWRConfig();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setIsLoggingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error(`Logout request failed with status ${response.status}`);
      }

      await mutate(() => true, undefined, { revalidate: false });

      for (const key of Array.from(cache.keys())) {
        cache.delete(key);
      }

      router.refresh();
    } catch {
      setError("Could not log out. Please try again.");
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
      {error ? (
        <InlineMessage tone="error">{error}</InlineMessage>
      ) : null}
    </div>
  );
}
