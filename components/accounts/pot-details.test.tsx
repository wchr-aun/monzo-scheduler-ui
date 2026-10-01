import { textContent } from "@/test-utils/text";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "@/components/providers/data-provider";
import { PotDetails } from "@/components/accounts/pot-details";
import { formatMoney } from "@/lib/formatting/money";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("PotDetails", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("displays the selected pot balance", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        pots: [
          {
            id: "pot_456",
            name: "Holiday",
            balance: 5_000,
            currency: "GBP",
            deleted: false,
          },
        ],
      }),
    );

    render(
      <DataProvider>
        <PotDetails accountId="acc_123" potId="pot_456" />
      </DataProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Pot balance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Holiday" }),
    ).toBeInTheDocument();
    expect(screen.getByText(textContent(formatMoney(5_000, "GBP")))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Schedule a transfer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to account/ })).toHaveAttribute(
      "href",
      "/console/account/acc_123",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/accounts/acc_123/pots",
      { cache: "no-store" },
    );
  });
});
