import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedzo - Demo",
  description:
    "Try Schedzo with sample accounts and pots. Create and manage simulated scheduled transfers without connecting a Monzo account or moving real money.",
};

export { DemoSession as default } from "@/components/demo/demo-session/demo-session";
