import type { ComponentPropsWithoutRef } from "react";
import { ExternalLinkIcon } from "@/components/ui/icons/external-link-icon/external-link-icon";

type ExternalLinkProps = Omit<ComponentPropsWithoutRef<"a">, "target" | "rel" | "href"> & {
  href: string;
};

export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}{"\u00a0"}<ExternalLinkIcon />
    </a>
  );
}
