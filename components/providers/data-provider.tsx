"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { SWRConfig } from "swr";
import { BALANCE_CACHE_WINDOW_MS } from "@/lib/accounts/keys";

export function DataProvider({ children }: { children: ReactNode }) {
  const config = useMemo(
    () => ({
      dedupingInterval: BALANCE_CACHE_WINDOW_MS,
      provider: () => new Map(),
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }),
    [],
  );

  return <SWRConfig value={config}>{children}</SWRConfig>;
}
