import { describe, expect, it } from "vitest";

import type { Session } from "../types";
import { getVehicleDeletionGuard } from "./vehicleManagement";

const session: Session = {
  id: "session-1",
  vehicleId: "veh-1",
  ownerId: "guest-local",
  status: "active",
  currentStep: "results",
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
  measurements: [],
  adjustments: [],
  finalChecklist: [],
  createdAt: "2026-07-25T12:00:00.000Z",
  updatedAt: "2026-07-25T12:00:00.000Z"
};

describe("vehicleManagement", () => {
  it("allows deletion when a vehicle has no saved sessions", () => {
    expect(getVehicleDeletionGuard("veh-1", [])).toEqual({
      canDelete: true,
      relatedSessionCount: 0,
      activeSessionCount: 0,
      completedSessionCount: 0,
      archivedSessionCount: 0
    });
  });

  it("blocks deletion when a vehicle is referenced by active, completed, or archived sessions", () => {
    const result = getVehicleDeletionGuard("veh-1", [
      session,
      { ...session, id: "session-2", status: "complete", currentStep: "report" },
      { ...session, id: "session-3", status: "archived", archivedFromStatus: "active" }
    ]);

    expect(result.canDelete).toBe(false);
    expect(result.relatedSessionCount).toBe(3);
    expect(result.activeSessionCount).toBe(1);
    expect(result.completedSessionCount).toBe(1);
    expect(result.archivedSessionCount).toBe(1);
    expect(result.reason).toMatch(/saved session history/i);
  });
});
