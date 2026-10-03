import type {Metadata} from "next";

export const metadata: Metadata = {
    title: {
        default: "Schedzo Console - Home",
        template: "Schedzo Console - %s",
    },
    description:
        "Connect your Monzo account to Schedzo, view your accounts and balances, and manage scheduled transfers into and out of your pots.",
};

export { ApplicationLayout as default } from "@/components/layout/application-layout";
