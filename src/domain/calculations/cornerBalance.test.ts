import { describe, expect, it } from "vitest";

import { calculateCornerBalance } from "./cornerBalance";

describe("calculateCornerBalance", () => {
  it("computes totals, percentages, diagonals, and ride-height metrics", () => {
    const result = calculateCornerBalance({
      weightsKg: {
        LF: 272.1554,
        RF: 281.2282,
        LR: 263.0826,
        RR: 276.6918
      },
      rideHeightsMm: {
        LF: 110,
        RF: 108,
        LR: 118,
        RR: 116
      },
      targetCrossPct: 50,
      selectedCrossConvention: "RF_LR"
    });

    expect(result.totalKg).toBeCloseTo(1093.158, 3);
    expect(result.frontPct).toBeCloseTo(50.6225, 3);
    expect(result.rearPct).toBeCloseTo(49.3775, 3);
    expect(result.crossLfRrPct).toBeCloseTo(50.2, 1);
    expect(result.crossRfLrPct).toBeCloseTo(49.8, 1);
    expect(result.selectedCrossPct).toBeCloseTo(49.8, 1);
    expect(result.crossErrorPct).toBeCloseTo(-0.2, 1);
    expect(result.frontSideDeltaMm).toBe(2);
    expect(result.rearSideDeltaMm).toBe(2);
    expect(result.rakeMm).toBe(8);
  });
});
