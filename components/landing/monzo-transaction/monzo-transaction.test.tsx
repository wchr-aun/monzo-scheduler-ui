import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {MonzoTransaction} from "./monzo-transaction";

describe("MonzoTransaction", () => {
  it("shows a declined payment without presenting its amount as sent", () => {
    render(<MonzoTransaction kind="declined" amount={227_300} recipient="Landlord" initials="L" />);
    expect(screen.getByText("Landlord")).toBeInTheDocument();
    expect(screen.getByText("Declined, you didn't have £2,273")).toBeInTheDocument();
    expect(screen.queryByLabelText(/sent$/)).not.toBeInTheDocument();
  });

  it("preserves pennies in a declined amount", () => {
    render(<MonzoTransaction kind="declined" amount={15_350} recipient="Landlord" initials="L" />);
    expect(screen.getByText("Declined, you didn't have £153.50")).toBeInTheDocument();
  });

  it("keeps the successful payment amount and reference", () => {
    render(<MonzoTransaction kind="payment" amount={227_300} recipient="Landlord" initials="L" reference="Rent" />);
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByLabelText("£2,273.00 sent")).toBeInTheDocument();
    expect(screen.queryByText(/Declined/)).not.toBeInTheDocument();
  });
});
