import { describe, expect, it } from "vitest";

import { calculateCornerBalance } from "../calculations/cornerBalance";
import { getCrossWeightGuidance } from "./crossWeightGuidance";

describe("getCrossWeightGuidance", () => {
  it("suggests supported-load changes when the selected diagonal is below target", () => {
    const calculations = calculateCornerBalance({
      weightsKg: {
        LF: 270,
        RF: 282,
        LR: 278,
        RR: 265
      },
      targetCrossPct: 50,
      selectedCrossConvention: "LF_RR"
    });

    const guidance = getCrossWeightGuidance({
      calculations,
      targetCrossPct: 50,
      tolerancePct: 0.25,
      selectedCrossConvention: "LF_RR",
      coiloverType: "single_adjuster_spring_perch"
    });

    expect(guidance.status).toBe("below");
    expect(guidance.actions[0]?.corner).toBe("LF");
    expect(guidance.actions[0]?.direction).toBe("increase_supported_load");
    expect(guidance.actions[1]?.corner).toBe("RR");
  });

  it("suppresses corner-turn style guidance when the architecture is unknown", () => {
    const calculations = calculateCornerBalance({
      weightsKg: {
        LF: 280,
        RF: 270,
        LR: 268,
        RR: 282
      },
      targetCrossPct: 50,
      selectedCrossConvention: "RF_LR"
    });

    const guidance = getCrossWeightGuidance({
      calculations,
      targetCrossPct: 50,
      tolerancePct: 0.25,
      selectedCrossConvention: "RF_LR",
      coiloverType: "unknown"
    });

    expect(guidance.status).toBe("identify_architecture");
    expect(guidance.actions).toHaveLength(0);
    expect(guidance.message).toMatch(/will not claim a universal perch-turn instruction/i);
  });

  it("stops chasing the number when the result is already within tolerance", () => {
    const calculations = calculateCornerBalance({
      weightsKg: {
        LF: 275,
        RF: 276,
        LR: 274,
        RR: 275
      },
      targetCrossPct: 50,
      selectedCrossConvention: "LF_RR"
    });

    const guidance = getCrossWeightGuidance({
      calculations,
      targetCrossPct: 50,
      tolerancePct: 0.3,
      selectedCrossConvention: "LF_RR",
      coiloverType: "single_adjuster_spring_perch"
    });

    expect(guidance.status).toBe("within");
    expect(guidance.actions).toHaveLength(0);
    expect(guidance.headline).toMatch(/within tolerance/i);
  });
});
