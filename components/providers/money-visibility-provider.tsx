"use client";

import { MONEY_VISIBILITY_STORAGE_KEY } from "@/lib/money/constants";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type MoneyVisibilityContextValue = {
  isMoneyHidden: boolean;
  toggleMoneyVisibility: () => void;
};

const MoneyVisibilityContext = createContext<MoneyVisibilityContextValue>({
  isMoneyHidden: false,
  toggleMoneyVisibility: () => undefined,
});

export function MoneyVisibilityProvider({ children }: { children: ReactNode }) {
  const [isMoneyHidden, setIsMoneyHidden] = useState(false);
  const [hasRestoredPreference, setHasRestoredPreference] = useState(false);

  useEffect(() => {
    try {
      setIsMoneyHidden(
        localStorage.getItem(MONEY_VISIBILITY_STORAGE_KEY) === "true",
      );
    } catch {
      // No preference can be restored, but toggling still works in memory.
    } finally {
      setHasRestoredPreference(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredPreference) {
      return;
    }

    try {
      localStorage.setItem(
        MONEY_VISIBILITY_STORAGE_KEY,
        String(isMoneyHidden),
      );
    } catch {
      // The in-memory visibility state is unaffected.
    }
  }, [hasRestoredPreference, isMoneyHidden]);

  const value = useMemo(
    () => ({
      isMoneyHidden,
      toggleMoneyVisibility: () => setIsMoneyHidden((hidden) => !hidden),
    }),
    [isMoneyHidden],
  );

  return (
    <MoneyVisibilityContext.Provider value={value}>
      {children}
    </MoneyVisibilityContext.Provider>
  );
}

export function useMoneyVisibility() {
  return useContext(MoneyVisibilityContext);
}
