import { AccountsPreloader } from "@/components/accounts/accounts-preloader";
import { DataProvider } from "@/components/providers/data-provider";
import { MoneyVisibilityProvider } from "@/components/providers/money-visibility-provider";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

export async function ApplicationLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const isLoggedIn = Boolean(cookieStore.get(sessionCookieName)?.value);

  return (
    <MoneyVisibilityProvider>
      <Navbar />
      <DataProvider>
        {isLoggedIn ? <AccountsPreloader /> : null}
        {children}
      </DataProvider>
      <Footer />
    </MoneyVisibilityProvider>
  );
}
