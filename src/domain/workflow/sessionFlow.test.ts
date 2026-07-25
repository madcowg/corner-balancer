import { describe, expect, it } from "vitest";

import { getNextSessionFlowStep, getPreviousSessionFlowStep } from "./sessionFlow";

describe("session flow helpers", () => {
  it("walks forward and backward through the workflow", () => {
    expect(getNextSessionFlowStep("workspace")).toBe("vehicle-prep");
    expect(getPreviousSessionFlowStep("results")).toBe("baseline");
  });
});
