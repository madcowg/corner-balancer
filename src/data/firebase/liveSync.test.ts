import { describe, expect, it } from "vitest";

import type { Session, Vehicle } from "../../domain/types";
import type { PersistedAppState } from "../repositories/types";
import {
  buildComparableStateFingerprint,
  mergeSignedInAppState
} from "./liveSync";

const vehicle: Vehicle = {
  id: "veh-1",
  ownerId: "user-1",
  nickname: "Miata",
  primaryUse: "autocross",
  coiloverType: "single_adjuster_spring_perch",
  preferredWeightUnit: "lb",
  preferredHeightUnit: "in",
  createdAt: "2026-07-25T10:00:00.000Z",
  updatedAt: "2026-07-25T10:00:00.000Z"
};

const session: Session = {
  id: "sess-1",
  vehicleId: "veh-1",
  ownerId: "user-1",
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
  createdAt: "2026-07-25T10:00:00.000Z",
  updatedAt: "2026-07-25T10:00:00.000Z"
};

function createState(
  overrides: Partial<PersistedAppState> = {}
): PersistedAppState {
  return {
    version: 1,
    auth: {
      mode: "signed_in",
      uid: "user-1",
      pendingGuestSync: false
    },
    vehicles: [vehicle],
    sessions: [session],
    lastSessionId: session.id,
    ...overrides
  };
}

describe("liveSync", () => {
  it("applies newer remote changes and preserves newer local changes", () => {
    const localState = createState({
      vehicles: [
        vehicle,
        { ...vehicle, id: "veh-local", nickname: "Local draft", updatedAt: "2026-07-25T12:00:00.000Z" }
      ],
      sessions: [
        session,
        {
          ...session,
          id: "sess-conflict",
          updatedAt: "2026-07-25T12:00:00.000Z",
          status: "active",
          adjustments: [
            {
              id: "adj-local",
              afterMeasurementId: "m-1",
              corner: "LF",
              adjusterType: "spring_seat",
              direction: "increase",
              amount: 0.25,
              amountUnit: "turn",
              reason: "Local change",
              createdAt: "2026-07-25T12:00:00.000Z"
            }
          ]
        }
      ]
    });

    const remoteState = createState({
      vehicles: [
        { ...vehicle, nickname: "Remote update", updatedAt: "2026-07-25T11:00:00.000Z" },
        { ...vehicle, id: "veh-remote", nickname: "Remote addition", updatedAt: "2026-07-25T11:30:00.000Z" }
      ],
      sessions: [
        { ...session, id: "sess-conflict", updatedAt: "2026-07-25T11:00:00.000Z" },
        { ...session, id: "sess-remote", updatedAt: "2026-07-25T11:30:00.000Z" }
      ],
      lastSessionId: "sess-remote"
    });

    const result = mergeSignedInAppState(localState, remoteState);

    expect(result.remoteChangesApplied).toBe(3);
    expect(result.localChangesPreserved).toBe(1);
    expect(result.hasConflict).toBe(true);
    expect(result.mergedState.vehicles.map((entry) => entry.id)).toEqual([
      "veh-1",
      "veh-local",
      "veh-remote"
    ]);
    expect(result.mergedState.vehicles.find((entry) => entry.id === "veh-1")?.nickname).toBe(
      "Remote update"
    );
    expect(
      result.mergedState.sessions.find((entry) => entry.id === "sess-conflict")?.adjustments[0]?.reason
    ).toBe("Local change");
    expect(result.mergedState.lastSessionId).toBe("sess-remote");
  });

  it("produces a stable fingerprint regardless of item order", () => {
    const left = createState({
      vehicles: [
        { ...vehicle, id: "veh-b" },
        { ...vehicle, id: "veh-a" }
      ],
      sessions: [
        { ...session, id: "sess-b" },
        { ...session, id: "sess-a" }
      ]
    });
    const right = createState({
      vehicles: [
        { ...vehicle, id: "veh-a" },
        { ...vehicle, id: "veh-b" }
      ],
      sessions: [
        { ...session, id: "sess-a" },
        { ...session, id: "sess-b" }
      ]
    });

    expect(buildComparableStateFingerprint(left)).toBe(buildComparableStateFingerprint(right));
  });
});
