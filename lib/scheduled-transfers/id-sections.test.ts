import { describe, expect, it } from "vitest";
import { getDifferingUuidSections } from "./id-sections";

describe("getDifferingUuidSections", () => {
  it("identifies differing sections when both outer sections match", () => {
    expect(
      getDifferingUuidSections(
        "1f1bcaec-f9e7-630a-9e5e-1efa182dcb5e",
        "1f1bcaec-f9e9-630a-bdae-1efa182dcb5e",
      ),
    ).toEqual([false, true, false, true, false]);
  });

  it("identifies every difference when only the last section matches", () => {
    expect(
      getDifferingUuidSections(
        "1f1bcaec-f9e7-630a-9e5e-1efa182dcb5e",
        "1f1bcaed-f9e9-630a-bdae-1efa182dcb5e",
      ),
    ).toEqual([true, true, false, true, false]);
  });

  it("does not differentiate IDs when neither outer section matches", () => {
    expect(
      getDifferingUuidSections(
        "1f1bcaec-f9e7-630a-9e5e-1efa182dcb5f",
        "1f1bcaed-f9e9-630a-bdae-1efa182dcb5e",
      ),
    ).toBeNull();
  });

  it("leaves non-UUID identifiers untouched", () => {
    expect(getDifferingUuidSections("transfer_1", "setup_1")).toBeNull();
  });
});
