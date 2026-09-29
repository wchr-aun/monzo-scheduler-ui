import { AccountsPreloader } from "@/components/accounts/accounts-preloader";
import { Footer } from "@/components/layout/footer";
import { DataProvider } from "@/components/providers/data-provider";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monzo Scheduler",
  description: "Sign in to Monzo Scheduler",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const isLoggedIn = Boolean(cookieStore.get(sessionCookieName)?.value);

  return (
    <html lang="en">
      <body>
        <DataProvider>
          {isLoggedIn ? <AccountsPreloader /> : null}
          {children}
        </DataProvider>
        <Footer />
      </body>
    </html>
  );
}
