import { describe, expect, it } from "vitest";

import type { Session, Vehicle } from "../../domain/types";
import type { PersistedAppState } from "../repositories/types";
import {
  buildFirestoreAppMetadata,
  parseFirestoreAppMetadata,
  remapGuestDataToUser
} from "./cloudState";

const vehicle: Vehicle = {
  id: "vehicle-1",
  ownerId: "guest-owner",
  nickname: "Spec Miata",
  primaryUse: "autocross",
  coiloverType: "single_adjuster_spring_perch",
  preferredWeightUnit: "lb",
  preferredHeightUnit: "in",
  createdAt: "2026-07-25T10:00:00.000Z",
  updatedAt: "2026-07-25T10:00:00.000Z"
};

const session: Session = {
  id: "session-1",
  vehicleId: "vehicle-1",
  ownerId: "guest-owner",
  status: "draft",
  currentStep: "setup",
  targetCrossPct: 50,
  crossTolerancePct: 0.5,
  sideHeightToleranceMm: 3,
  totalDriftWarningPct: 1,
  setupSnapshot: {
    version: 1,
    eventType: "Solo",
    weightUnit: "lb",
    heightUnit: "in",
    pressureUnit: "psi",
    targetCrossPct: 50,
    crossTolerancePct: 0.5,
    selectedCrossConvention: "LF_RR",
    sideHeightToleranceMm: 3,
    fuelDescription: "Half tank",
    swayBarState: "connected"
  },
  safetyChecklist: [],
  measurements: [],
  adjustments: [],
  finalChecklist: [],
  createdAt: "2026-07-25T10:00:00.000Z",
  updatedAt: "2026-07-25T10:00:00.000Z"
};

const baseState: PersistedAppState = {
  version: 1,
  auth: {
    mode: "guest",
    pendingGuestSync: true
  },
  vehicles: [vehicle],
  sessions: [session],
  lastSessionId: "session-1"
};

describe("cloudState helpers", () => {
  it("builds Firestore metadata from persisted app state", () => {
    expect(
      buildFirestoreAppMetadata(baseState, "2026-07-25T11:00:00.000Z")
    ).toEqual({
      version: 1,
      lastSessionId: "session-1",
      updatedAt: "2026-07-25T11:00:00.000Z"
    });
  });

  it("parses valid Firestore metadata and rejects invalid shapes", () => {
    expect(
      parseFirestoreAppMetadata({
        version: 1,
        lastSessionId: "session-1",
        updatedAt: "2026-07-25T11:00:00.000Z"
      })
    ).toEqual({
      version: 1,
      lastSessionId: "session-1",
      updatedAt: "2026-07-25T11:00:00.000Z"
    });
    expect(parseFirestoreAppMetadata({ version: "1" })).toBeUndefined();
  });

  it("remaps guest-owned records to the signed-in user", () => {
    expect(
      remapGuestDataToUser(
        {
          ...baseState,
          auth: {
            mode: "signed_in",
            uid: "user-123",
            email: "driver@example.com",
            pendingGuestSync: true
          },
          vehicles: [
            vehicle,
            { ...vehicle, id: "vehicle-2", ownerId: "user-123", nickname: "Daily" }
          ]
        },
        "guest-owner",
        "user-123",
        "2026-07-25T11:00:00.000Z"
      )
    ).toEqual({
      ...baseState,
      auth: {
        mode: "signed_in",
        uid: "user-123",
        email: "driver@example.com",
        pendingGuestSync: false
      },
      vehicles: [
        {
          ...vehicle,
          ownerId: "user-123",
          updatedAt: "2026-07-25T11:00:00.000Z"
        },
        {
          ...vehicle,
          id: "vehicle-2",
          ownerId: "user-123",
          nickname: "Daily"
        }
      ],
      sessions: [
        {
          ...session,
          ownerId: "user-123",
          updatedAt: "2026-07-25T11:00:00.000Z"
        }
      ],
      lastSessionId: "session-1"
    });
  });
});
