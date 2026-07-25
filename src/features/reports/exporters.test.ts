import { describe, expect, it } from "vitest";

import { buildSessionCsv, buildSessionJson, buildSessionPdf } from "./exporters";
import type { Session, Vehicle } from "../../domain/types";

const vehicle: Vehicle = {
  id: "veh-1",
  ownerId: "guest-local",
  nickname: "Spec Miata",
  primaryUse: "autocross",
  coiloverType: "single_adjuster_spring_perch",
  preferredWeightUnit: "lb",
  preferredHeightUnit: "in",
  createdAt: "2026-07-25T12:00:00.000Z",
  updatedAt: "2026-07-25T12:00:00.000Z"
};

const session: Session = {
  id: "sess-1",
  vehicleId: vehicle.id,
  ownerId: vehicle.ownerId,
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
  safetyChecklist: [],
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
        crossErrorPct: 0.3
      },
      settled: true,
      valid: true,
      warnings: [],
      createdAt: "2026-07-25T12:30:00.000Z"
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
  finalChecklist: [],
  createdAt: "2026-07-25T12:00:00.000Z",
  updatedAt: "2026-07-25T13:00:00.000Z",
  completedAt: "2026-07-25T13:05:00.000Z"
};

describe("report exporters", () => {
  it("serializes JSON with vehicle and session data", () => {
    const output = buildSessionJson(vehicle, session);

    expect(output).toMatch(/Spec Miata/);
    expect(output).toMatch(/sess-1/);
  });

  it("serializes CSV rows for measurements and adjustments", () => {
    const output = buildSessionCsv(vehicle, session);

    expect(output).toMatch(/"measurement"/);
    expect(output).toMatch(/"adjustment"/);
    expect(output).toMatch(/"selected_cross_pct"/);
  });

  it("creates a PDF byte stream", async () => {
    const bytes = await buildSessionPdf(vehicle, session);
    const header = String.fromCharCode(...bytes.slice(0, 4));

    expect(header).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(200);
  });
});
