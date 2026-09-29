import { AccountsPreloader } from "@/components/accounts/accounts-preloader";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { DataProvider } from "@/components/providers/data-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monzo Scheduler",
  description: "Sign in to Monzo Scheduler",
};

const themeInitializationScript = `
  try {
    const storedTheme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "session";
  const isLoggedIn = Boolean(cookieStore.get(sessionCookieName)?.value);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <Navbar />
        <DataProvider>
          {isLoggedIn ? <AccountsPreloader /> : null}
          {children}
        </DataProvider>
        <Footer />
      </body>
    </html>
  );
}
