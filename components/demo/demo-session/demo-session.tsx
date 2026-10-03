"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { LoginButton } from "@/components/auth/login-button/login-button";
import { LogoutButton } from "@/components/auth/logout-button/logout-button";
import { AccountsList } from "@/components/accounts/accounts-list/accounts-list";
import { PageContainer } from "@/components/layout/page-container/page-container";
import { Navbar } from "@/components/layout/navbar/navbar";
import { Footer } from "@/components/layout/footer/footer";
import { DataProvider } from "@/components/providers/data-provider";
import { MoneyVisibilityProvider } from "@/components/providers/money-visibility-provider";
import { ConsoleClientContext } from "@/components/providers/console-client-provider";
import { createDemoClient } from "@/lib/demo/client";
import { DEMO_USER_ID } from "@/lib/demo/fixtures";
import styles from "./demo-session.module.css";

const DemoSessionContext = createContext({ loggedIn: false, login: () => {}, logout: () => {} });

export function DemoSession({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [client] = useState(() => createDemoClient());
  return (
    <DemoSessionContext.Provider value={{ loggedIn, login: () => setLoggedIn(true), logout: () => setLoggedIn(false) }}>
      <MoneyVisibilityProvider>
        <Navbar logoHref="/demo" demoMode />
        <ConsoleClientContext.Provider value={client}>
          <DataProvider>{children}</DataProvider>
        </ConsoleClientContext.Provider>
        <Footer />
      </MoneyVisibilityProvider>
    </DemoSessionContext.Provider>
  );
}

export function DemoGate({ children }: { children: ReactNode }) {
  const { loggedIn, login } = useContext(DemoSessionContext);
  return loggedIn ? children : (
    <PageContainer centered width="narrow">
      <LoginButton href="/demo" onLogin={login} />
    </PageContainer>
  );
}

export function DemoAccounts() {
  const { logout } = useContext(DemoSessionContext);
  return (
    <DemoGate>
      <PageContainer centered width="wide">
        <div className={styles.accounts}>
          <AccountsList userId={DEMO_USER_ID} />
          <LogoutButton onLogout={logout} />
        </div>
      </PageContainer>
    </DemoGate>
  );
}
