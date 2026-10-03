"use client";

import { MONEY_VISIBILITY_STORAGE_KEY } from "@/lib/money/constants";
import { useToast } from "@/components/providers/toast-provider/toast-provider";
import { AppError } from "@/lib/errors/app-error";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const { reportError } = useToast();
  const [isMoneyHidden, setIsMoneyHidden] = useState(false);
  const [hasRestoredPreference, setHasRestoredPreference] = useState(false);
  const hasChangedPreference = useRef(false);

  useEffect(() => {
    try {
      setIsMoneyHidden(
        localStorage.getItem(MONEY_VISIBILITY_STORAGE_KEY) === "true",
      );
    } catch {
      reportError(new AppError("frontend", "restore browser preferences", "preference_restore_failed"));
    } finally {
      setHasRestoredPreference(true);
    }
  }, [reportError]);

  useEffect(() => {
    // Do not overwrite an unreadable saved preference with defaults on startup.
    if (!hasRestoredPreference || !hasChangedPreference.current) {
      return;
    }

    try {
      localStorage.setItem(
        MONEY_VISIBILITY_STORAGE_KEY,
        String(isMoneyHidden),
      );
    } catch {
      reportError(new AppError("frontend", "save browser preferences", "preference_save_failed"));
    }
  }, [hasRestoredPreference, isMoneyHidden, reportError]);

  const value = useMemo(
    () => ({
      isMoneyHidden,
      toggleMoneyVisibility: () => {
        hasChangedPreference.current = true;
        setIsMoneyHidden((hidden) => !hidden);
      },
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
