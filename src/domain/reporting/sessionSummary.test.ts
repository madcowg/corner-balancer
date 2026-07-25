import { describe, expect, it } from "vitest";

import type { Session } from "../types";
import { buildSessionSummary, summarizeChecklist } from "./sessionSummary";

const session: Session = {
  id: "sess-1",
  vehicleId: "veh-1",
  ownerId: "guest-local",
  status: "complete",
  currentStep: "report",
  targetCrossPct: 50,
  crossTolerancePct: 0.25,
  sideHeightToleranceMm: 3,
  totalDriftWarningPct: 1,
  setupSnapshot: {
    version: 1,
    eventType: "autocross",
    weightUnit: "lb",
    heightUnit: "in",
    pressureUnit: "psi",
    targetCrossPct: 50,
    crossTolerancePct: 0.25,
    selectedCrossConvention: "RF_LR",
    sideHeightToleranceMm: 3,
    fuelDescription: "Half tank",
    swayBarState: "neutralized"
  },
  safetyChecklist: [
    {
      id: "safe-1",
      label: "Pads clear",
      severity: "critical",
      checked: false,
      updatedAt: "2026-07-25T12:10:00.000Z"
    },
    {
      id: "safe-2",
      label: "Jack stands verified",
      severity: "blocked",
      checked: false,
      overrideReason: "Vehicle remained on ramps only.",
      updatedAt: "2026-07-25T12:10:00.000Z"
    }
  ],
  measurements: [
    {
      id: "m-1",
      sequence: 0,
      weightsKg: { LF: 270, RF: 280, LR: 275, RR: 278 },
      calculations: {
        totalKg: 1103,
        frontPct: 49.9,
        rearPct: 50.1,
        leftPct: 49.4,
        rightPct: 50.6,
        crossLfRrPct: 49.7,
        crossRfLrPct: 50.3,
        selectedCrossConvention: "RF_LR",
        selectedCrossPct: 50.3,
        targetCrossPct: 50,
        crossErrorPct: 0.3,
        rakeMm: 7
      },
      settled: true,
      valid: true,
      warnings: ["Fuel load changed from baseline."],
      createdAt: "2026-07-25T12:30:00.000Z"
    },
    {
      id: "m-2",
      sequence: 1,
      weightsKg: { LF: 271, RF: 279, LR: 276, RR: 277 },
      calculations: {
        totalKg: 1103,
        frontPct: 49.9,
        rearPct: 50.1,
        leftPct: 49.6,
        rightPct: 50.4,
        crossLfRrPct: 49.7,
        crossRfLrPct: 50.3,
        selectedCrossConvention: "RF_LR",
        selectedCrossPct: 50.1,
        targetCrossPct: 50,
        crossErrorPct: 0.1,
        rakeMm: 6
      },
      settled: true,
      valid: true,
      warnings: [],
      createdAt: "2026-07-25T12:50:00.000Z"
    }
  ],
  adjustments: [
    {
      id: "a-1",
      afterMeasurementId: "m-1",
      corner: "LF",
      adjusterType: "spring_seat",
      direction: "increase",
      amount: 0.25,
      amountUnit: "turn",
      reason: "Trim diagonal error",
      createdAt: "2026-07-25T12:40:00.000Z"
    }
  ],
  finalChecklist: [
    {
      id: "final-1",
      label: "Torque wheels",
      severity: "critical",
      checked: true,
      updatedAt: "2026-07-25T13:05:00.000Z"
    }
  ],
  createdAt: "2026-07-25T12:00:00.000Z",
  updatedAt: "2026-07-25T13:00:00.000Z",
  completedAt: "2026-07-25T13:05:00.000Z"
};

describe("sessionSummary", () => {
  it("summarizes checklist progress and overrides", () => {
    expect(summarizeChecklist(session.safetyChecklist)).toEqual({
      total: 2,
      checked: 0,
      unresolved: 2,
      overridden: 1,
      blockedOpen: 1,
      criticalOpen: 1
    });
  });

  it("builds a session summary with baseline/final deltas", () => {
    expect(buildSessionSummary(session)).toEqual({
      measurementCount: 2,
      adjustmentCount: 1,
      latestWarnings: [],
      warningCount: 1,
      targetCrossPct: 50,
      crossTolerancePct: 0.25,
      baselineCrossPct: 50.3,
      finalCrossPct: 50.1,
      crossChangePct: -0.19999999999999574,
      finalCrossErrorPct: 0.1,
      withinCrossTolerance: true,
      baselineTotalKg: 1103,
      finalTotalKg: 1103,
      totalChangeKg: 0,
      baselineRakeMm: 7,
      finalRakeMm: 6,
      rakeChangeMm: -1,
      safetyChecklist: {
        total: 2,
        checked: 0,
        unresolved: 2,
        overridden: 1,
        blockedOpen: 1,
        criticalOpen: 1
      },
      finalChecklist: {
        total: 1,
        checked: 1,
        unresolved: 0,
        overridden: 0,
        blockedOpen: 0,
        criticalOpen: 0
      }
    });
  });
});
