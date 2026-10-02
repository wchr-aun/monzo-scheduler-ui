import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLink } from "./external-link";

describe("ExternalLink", () => {
  it("opens the destination in a new tab with safe link attributes", () => {
    render(<ExternalLink href="https://example.test/docs">Read the docs</ExternalLink>);

    const link = screen.getByRole("link", { name: "Read the docs" });
    expect(link).toHaveAttribute("href", "https://example.test/docs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("forwards presentation and accessibility attributes", () => {
    render(<ExternalLink href="/console" className="console-link" aria-label="Open console">Console</ExternalLink>);

    const link = screen.getByRole("link", { name: "Open console" });
    expect(link).toHaveAttribute("href", "/console");
    expect(link).toHaveClass("console-link");
  });
});
