"use client";

import {AccessNotApprovedError, fetchAccounts,} from "@/lib/accounts/client";
import {ACCOUNTS_KEY, getBalanceKey, getBalanceLoadedAtKey,} from "@/lib/accounts/keys";
import {useCallback} from "react";
import useSWR, {useSWRConfig} from "swr";

const APPROVAL_RETRY_INTERVAL = 5_000;

export function useAccounts() {
  const { mutate } = useSWRConfig();
  const fetchAccountsAndCacheBalances = useCallback(
    async (url: string) => {
      const loadedAccounts = await fetchAccounts(url);

      await Promise.all(
        loadedAccounts.map((account) => {
          if (!account.balance_details) {
            return undefined;
          }

          return Promise.all([
            mutate(getBalanceKey(account.id), account.balance_details, false),
            mutate(getBalanceLoadedAtKey(account.id), Date.now(), false),
          ]);
        }),
      );

      return loadedAccounts;
    },
    [mutate],
  );

  return useSWR(ACCOUNTS_KEY, fetchAccountsAndCacheBalances, {
    revalidateIfStale: false,
    shouldRetryOnError: (error) => error instanceof AccessNotApprovedError,
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      if (!(error instanceof AccessNotApprovedError)) {
        return;
      }

      setTimeout(
        () => revalidate({ retryCount }),
        APPROVAL_RETRY_INTERVAL,
      );
    },
  });
}
