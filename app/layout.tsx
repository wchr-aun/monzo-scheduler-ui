import {THEME_STORAGE_KEY} from "@/lib/theme/constants";
import type {Metadata} from "next";
import type {ReactNode} from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monzo Scheduler",
  description: "A project for managing scheduled Monzo pot transfers",
  icons: {
    icon: "/favicon.ico",
  },
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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
