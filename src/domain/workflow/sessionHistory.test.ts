import { describe, expect, it } from "vitest";

import type { Session } from "../types";
import {
  filterSessionsByStatus,
  getLatestNonArchivedSession,
  getRestoredSessionStatus,
  getSessionLaunchStep,
  sortSessionsByUpdatedAt
} from "./sessionHistory";

const baseSession: Session = {
  id: "session-1",
  vehicleId: "veh-1",
  ownerId: "guest-local",
  status: "draft",
  currentStep: "setup",
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

describe("sessionHistory helpers", () => {
  it("sorts sessions by latest update first and finds the latest non-archived session", () => {
    const archived = {
      ...baseSession,
      id: "session-archived",
      status: "archived" as const,
      archivedFromStatus: "active" as const,
      updatedAt: "2026-07-25T14:00:00.000Z"
    };
    const active = {
      ...baseSession,
      id: "session-active",
      status: "active" as const,
      currentStep: "results" as const,
      updatedAt: "2026-07-25T13:00:00.000Z"
    };

    expect(sortSessionsByUpdatedAt([active, archived]).map((session) => session.id)).toEqual([
      "session-archived",
      "session-active"
    ]);
    expect(getLatestNonArchivedSession([active, archived])?.id).toBe("session-active");
  });

  it("filters sessions into active, completed, and archived groups", () => {
    const sessions: Session[] = [
      baseSession,
      { ...baseSession, id: "active", status: "active", updatedAt: "2026-07-25T13:00:00.000Z" },
      {
        ...baseSession,
        id: "complete",
        status: "complete",
        currentStep: "report",
        completedAt: "2026-07-25T14:00:00.000Z",
        updatedAt: "2026-07-25T14:00:00.000Z"
      },
      {
        ...baseSession,
        id: "alignment",
        status: "alignment_pending",
        currentStep: "report",
        completedAt: "2026-07-25T14:30:00.000Z",
        updatedAt: "2026-07-25T14:30:00.000Z"
      },
      {
        ...baseSession,
        id: "archived",
        status: "archived",
        archivedFromStatus: "complete",
        updatedAt: "2026-07-25T15:00:00.000Z"
      }
    ];

    expect(filterSessionsByStatus(sessions, "active").map((session) => session.id)).toEqual([
      "active",
      "session-1"
    ]);
    expect(filterSessionsByStatus(sessions, "completed").map((session) => session.id)).toEqual([
      "alignment",
      "complete"
    ]);
    expect(filterSessionsByStatus(sessions, "archived").map((session) => session.id)).toEqual([
      "archived"
    ]);
  });

  it("restores archived sessions to their previous or inferred status", () => {
    expect(
      getRestoredSessionStatus({
        ...baseSession,
        status: "archived",
        archivedFromStatus: "alignment_pending"
      })
    ).toBe("alignment_pending");
    expect(
      getRestoredSessionStatus({
        ...baseSession,
        status: "archived",
        currentStep: "report",
        completedAt: "2026-07-25T15:00:00.000Z"
      })
    ).toBe("complete");
    expect(
      getRestoredSessionStatus({
        ...baseSession,
        status: "archived",
        currentStep: "results",
        measurements: [
          {
            id: "m-1",
            sequence: 0,
            weightsKg: { LF: 1, RF: 1, LR: 1, RR: 1 },
            calculations: {
              totalKg: 4,
              frontPct: 50,
              rearPct: 50,
              leftPct: 50,
              rightPct: 50,
              crossLfRrPct: 50,
              crossRfLrPct: 50,
              selectedCrossConvention: "RF_LR",
              selectedCrossPct: 50,
              targetCrossPct: 50,
              crossErrorPct: 0
            },
            settled: true,
            valid: true,
            warnings: [],
            createdAt: "2026-07-25T13:00:00.000Z"
          }
        ]
      })
    ).toBe("active");
  });

  it("routes finished sessions to the report step and active ones to their current step", () => {
    expect(
      getSessionLaunchStep({ ...baseSession, status: "complete", currentStep: "results" })
    ).toBe("report");
    expect(
      getSessionLaunchStep({ ...baseSession, status: "active", currentStep: "adjust" })
    ).toBe("adjust");
  });
});
