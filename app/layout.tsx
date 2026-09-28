import type {Metadata} from "next";
import type {ReactNode} from "react";
import {DataProvider} from "./data-provider";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Monzo Scheduler",
  description: "Sign in to Monzo Scheduler",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DataProvider>{children}</DataProvider>
        <footer>Copyright @ {new Date().getUTCFullYear()} by <Link href="https://github.com/wchr-aun">wchr-aun</Link></footer>
      </body>
    </html>
  );
}
