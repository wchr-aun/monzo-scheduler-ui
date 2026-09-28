"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { SWRConfig } from "swr";

const ONE_MINUTE_IN_MS = 60 * 1_000;

export function DataProvider({ children }: { children: ReactNode }) {
  const config = useMemo(
    () => ({
      dedupingInterval: ONE_MINUTE_IN_MS,
      provider: () => new Map(),
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }),
    [],
  );

  return <SWRConfig value={config}>{children}</SWRConfig>;
}
