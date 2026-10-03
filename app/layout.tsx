import {THEME_STORAGE_KEY} from "@/lib/theme/constants";
import type {Metadata} from "next";
import type {ReactNode} from "react";
import "./globals.css";
import {ToastProvider} from "@/components/providers/toast-provider/toast-provider";

export const metadata: Metadata = {
  title: "Schedzo - On schedule.",
  description:
    "Schedule transfers into and out of your Monzo pots with Schedzo. Automate recurring deposits and withdrawals, track upcoming transfers, and manage your saving plans.",
  icons: {
    icon: "/favicon.ico",
  },
};

const themeInitializationScript = `
  try {
    const storedTheme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (storedTheme === "light" || storedTheme === "dark") {
      document.documentElement.dataset.theme = storedTheme;
    }
  } catch {
    // Report once the toast provider mounts; CSS still follows the system theme.
    document.documentElement.dataset.themeStorageUnavailable = "true";
  }
`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
