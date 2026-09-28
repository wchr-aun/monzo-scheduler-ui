import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DataProvider } from "./data-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monzo Scheduler",
  description: "Sign in to Monzo Scheduler",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DataProvider>{children}</DataProvider>
      </body>
    </html>
  );
}
