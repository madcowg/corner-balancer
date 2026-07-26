import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import {
  CornerBalanceAppContext,
  type AppContextValue,
  type VehicleDraftInput
} from "../../app/context";
import type { Session, Vehicle } from "../../domain/types";
import { GarageScreen } from "./GarageScreen";

const vehicle: Vehicle = {
  id: "veh-1",
  ownerId: "guest-local",
  nickname: "Street STX Miata",
  year: 2002,
  make: "Mazda",
  model: "Miata",
  trim: "LS",
  primaryUse: "autocross",
  coiloverType: "single_adjuster_spring_perch",
  preferredWeightUnit: "lb",
  preferredHeightUnit: "in",
  notes: "Current notes",
  createdAt: "2026-07-25T12:00:00.000Z",
  updatedAt: "2026-07-25T12:00:00.000Z"
};

const session: Session = {
  id: "sess-1",
  vehicleId: vehicle.id,
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

function createContextValue(
  overrides: Partial<AppContextValue> = {}
): AppContextValue {
  return {
    ready: true,
    firebaseConfigured: false,
    auth: {
      mode: "guest",
      pendingGuestSync: false
    },
    vehicles: [vehicle],
    sessions: [],
    lastSessionId: undefined,
    saveStatus: "saved",
    cloudSyncStatus: "local_only",
    cloudSyncMessage: undefined,
    lastSavedAt: "2026-07-25T12:00:00.000Z",
    lastCloudSyncAt: undefined,
    error: undefined,
    getVehicle(vehicleId) {
      return this.vehicles.find((entry) => entry.id === vehicleId);
    },
    getSession(sessionId) {
      return this.sessions.find((entry) => entry.id === sessionId);
    },
    setLastSessionId: vi.fn(),
    createVehicle: vi.fn((input: VehicleDraftInput) => ({
      ...vehicle,
      id: "veh-new",
      nickname: input.nickname
    })),
    updateVehicle: vi.fn(),
    deleteVehicle: vi.fn().mockResolvedValue({ ok: true }),
    createSession: vi.fn(),
    createSessionFromTemplate: vi.fn(),
    archiveSession: vi.fn(),
    restoreSession: vi.fn(),
    updateSessionSetup: vi.fn(),
    setSessionStep: vi.fn(),
    updateChecklistItem: vi.fn(),
    recordMeasurement: vi.fn(),
    logAdjustment: vi.fn(),
    completeSession: vi.fn(),
    requestEmailLink: vi.fn().mockResolvedValue(false),
    signInWithGoogle: vi.fn().mockResolvedValue(false),
    signInAnonymously: vi.fn().mockResolvedValue(false),
    signOut: vi.fn().mockResolvedValue(undefined),
    syncGuestDataToCloud: vi.fn().mockResolvedValue(false),
    clearLocalData: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function renderGarage(overrides: Partial<AppContextValue> = {}) {
  const value = createContextValue(overrides);

  render(
    <MemoryRouter>
      <CornerBalanceAppContext.Provider value={value}>
        <GarageScreen />
      </CornerBalanceAppContext.Provider>
    </MemoryRouter>
  );

  return value;
}

describe("GarageScreen", () => {
  it("disables profile deletion when session history exists", () => {
    renderGarage({
      sessions: [session]
    });

    expect(screen.getByText(/delete locked while 1 saved session/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete empty profile/i })).toBeDisabled();
  });

  it("opens inline vehicle editing with the saved profile values", async () => {
    const user = userEvent.setup();
    renderGarage();

    const editButton = screen.getAllByRole("button", { name: /edit profile/i })[0];
    if (!editButton) {
      throw new Error("Expected an edit profile button.");
    }

    await user.click(editButton);

    const nicknameInput = await screen.findByDisplayValue(vehicle.nickname);
    const notesInput = screen.getByDisplayValue(vehicle.notes ?? "");
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    expect(nicknameInput).toBeInTheDocument();
    expect(notesInput).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
  });
});
