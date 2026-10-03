import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/providers/toast-provider/toast-provider";
import { AccountDetails } from "@/components/accounts/account-details/account-details";
import { PotDetails } from "@/components/pots/pot-details/pot-details";
import { ScheduledTransfers } from "@/components/scheduled-transfers/scheduled-transfers/scheduled-transfers";
import { DEMO_ACCOUNT_ID, DEMO_JOINT_ACCOUNT_ID, DEMO_USER_ID, demoPots, demoJointPots } from "@/lib/demo/fixtures";
import { DemoAccounts, DemoGate, DemoSession } from "./demo-session";
import type { ReactNode } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function Demo({ children }: { children: ReactNode }) {
  return <ToastProvider><DemoSession>{children}</DemoSession></ToastProvider>;
}

const emptyPot = demoPots.find((pot) => pot.name === "Hobbies")!;
function potPage(potId = emptyPot.id, accountId = DEMO_ACCOUNT_ID) {
  return <DemoGate>
    <PotDetails accountId={accountId} potId={potId} />
    <ScheduledTransfers accountId={accountId} potId={potId} />
  </DemoGate>;
}

describe("demo console", () => {
  const fetchMock = vi.fn(() => { throw new Error("Demo must not fetch"); });
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("logs in immediately, uses demo navigation and sample pots, and logs out without requests", async () => {
    const view = render(<Demo><DemoAccounts /></Demo>);
    fireEvent.click(screen.getByRole("link", { name: "Login with Monzo" }));
    expect(await screen.findByRole("link", { name: "View Main Account" })).toHaveAttribute("href", `/demo/account/${DEMO_ACCOUNT_ID}`);
    expect(screen.getByRole("link", { name: "View Joint Account" })).toHaveAttribute("href", `/demo/account/${DEMO_JOINT_ACCOUNT_ID}`);
    view.rerender(<Demo><DemoGate><AccountDetails accountId={DEMO_ACCOUNT_ID} userId={DEMO_USER_ID} /></DemoGate></Demo>);
    expect(await screen.findByRole("link", { name: "View Savings" })).toHaveAttribute("href", `/demo/account/${DEMO_ACCOUNT_ID}/pot/${demoPots[4].id}`);
    expect(screen.getByRole("link", { name: /Back to accounts/ })).toHaveAttribute("href", "/demo");
    expect(screen.queryByText("Round-up Savings - Default")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Hide deleted pots" }));
    expect(screen.getByText("Round-up Savings - Default")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View Round-up Savings" })).not.toBeInTheDocument();
    view.rerender(<Demo><DemoAccounts /></Demo>);
    fireEvent.click(await screen.findByRole("button", { name: "Log out" }));
    expect(screen.getByRole("link", { name: "Login with Monzo" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gates deep links and creates and cancels transfers using the real form and cards", async () => {
    const view = render(<Demo>{potPage()}</Demo>);
    expect(screen.queryByRole("heading", { name: "Hobbies" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Login with Monzo" }));
    expect(await screen.findByText("No scheduled transfers found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to account/ })).toHaveAttribute("href", `/demo/account/${DEMO_ACCOUNT_ID}`);
    fireEvent.click(screen.getByRole("button", { name: "Schedule a transfer" }));
    fireEvent.change(screen.getByLabelText("Amount (pence)"), { target: { value: "2500" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create scheduled transfer" }).closest("form")!);
    const details = await screen.findByRole("button", { name: "Show details for transfer demo_created_transfer_1" });
    expect(details.closest("li")).toHaveTextContent("pending");
    // Leaving and revisiting the pot keeps the same store and SWR cache.
    view.rerender(<Demo><DemoAccounts /></Demo>);
    await screen.findByRole("heading", { name: "Accounts" });
    view.rerender(<Demo>{potPage()}</Demo>);
    fireEvent.click(await screen.findByRole("button", { name: "Show details for transfer demo_created_transfer_1" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel transfer demo_created_transfer_1" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /details for transfer demo_created_transfer_1/ })).not.toBeInTheDocument());
    expect(await screen.findByText("No scheduled transfers found.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("paginates sample history and filters to cancelled schedules", async () => {
    render(<Demo>{potPage(demoPots[4].id)}</Demo>);
    fireEvent.click(screen.getByRole("link", { name: "Login with Monzo" }));
    const pages = await screen.findByRole("navigation", { name: "Scheduled transfers pages" });
    expect(pages).toHaveTextContent("1–50 of 60");
    fireEvent.click(within(pages).getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("navigation", { name: "Scheduled transfers pages" })).toHaveTextContent("51–60 of 60"));
    fireEvent.click(screen.getByRole("button", { name: /Status/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "cancelled" }));
    for (const status of ["completed", "pending", "failed"]) fireEvent.click(screen.getByRole("checkbox", { name: status }));
    await waitFor(() => expect(screen.queryByRole("navigation", { name: "Scheduled transfers pages" })).not.toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(screen.getAllByText("cancelled").length).toBeGreaterThan(1));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("browses the joint account and creates a schedule in its own pot", async () => {
    const groceries = demoJointPots.find((pot) => pot.name === "Groceries")!;
    const view = render(<Demo><DemoGate>
      <AccountDetails accountId={DEMO_JOINT_ACCOUNT_ID} userId={DEMO_USER_ID} />
    </DemoGate></Demo>);
    fireEvent.click(screen.getByRole("link", { name: "Login with Monzo" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Joint Account" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "View Groceries" })).toHaveAttribute(
      "href", `/demo/account/${DEMO_JOINT_ACCOUNT_ID}/pot/${groceries.id}`,
    );
    expect(screen.queryByRole("link", { name: "View Savings" })).not.toBeInTheDocument();
    view.rerender(<Demo>{potPage(groceries.id, DEMO_JOINT_ACCOUNT_ID)}</Demo>);
    await screen.findByText("No scheduled transfers found.");
    fireEvent.click(screen.getByRole("button", { name: "Schedule a transfer" }));
    fireEvent.change(screen.getByLabelText("Amount (pence)"), { target: { value: "5000" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create scheduled transfer" }).closest("form")!);
    expect(await screen.findByRole("button", { name: "Show details for transfer demo_created_transfer_1" })).toBeInTheDocument();
    view.rerender(<Demo>{potPage()}</Demo>);
    expect(await screen.findByText("No scheduled transfers found.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
