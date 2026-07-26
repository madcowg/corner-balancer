import { createContext, useContext } from "react";

import type {
  Adjustment,
  AdjustmentAmountUnit,
  AdjustmentDirection,
  AdjustmentType,
  ChecklistRecord,
  CoiloverType,
  Corner,
  Session,
  SessionFlowStep,
  SetupSnapshot,
  Vehicle,
  VehicleUse
} from "../domain/types";
import type { MeasurementInput, MeasurementValidationResult } from "../domain/validation/measurement";
import type { PersistedAppState } from "../data/repositories/types";

export type SaveStatus = "idle" | "saving" | "saved" | "sync_pending" | "error";
export type CloudSyncStatus =
  | "local_only"
  | "connecting"
  | "waiting_for_guest_sync"
  | "syncing"
  | "using_cache"
  | "synced"
  | "remote_update"
  | "conflict"
  | "error";

export interface VehicleDraftInput {
  nickname: string;
  year?: number | undefined;
  make?: string | undefined;
  model?: string | undefined;
  trim?: string | undefined;
  primaryUse: VehicleUse;
  coiloverType: CoiloverType;
  preferredWeightUnit: Vehicle["preferredWeightUnit"];
  preferredHeightUnit: Vehicle["preferredHeightUnit"];
  notes?: string | undefined;
}

export interface AdjustmentDraftInput {
  corner: Corner;
  adjusterType: AdjustmentType;
  direction: AdjustmentDirection;
  amount: number;
  amountUnit: AdjustmentAmountUnit;
  reason: string;
}

export interface DeleteVehicleResult {
  ok: boolean;
  reason?: string | undefined;
  message?: string | undefined;
}

export interface AppContextValue {
  ready: boolean;
  firebaseConfigured: boolean;
  auth: PersistedAppState["auth"];
  vehicles: Vehicle[];
  sessions: Session[];
  lastSessionId?: string | undefined;
  saveStatus: SaveStatus;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncMessage?: string | undefined;
  lastSavedAt?: string | undefined;
  lastCloudSyncAt?: string | undefined;
  error?: string | undefined;
  getVehicle(vehicleId: string): Vehicle | undefined;
  getSession(sessionId: string): Session | undefined;
  setLastSessionId(sessionId?: string): void;
  createVehicle(input: VehicleDraftInput): Vehicle;
  updateVehicle(vehicleId: string, updates: Partial<VehicleDraftInput>): void;
  deleteVehicle(vehicleId: string): Promise<DeleteVehicleResult>;
  createSession(vehicleId: string): Session | undefined;
  createSessionFromTemplate(sessionId: string): Session | undefined;
  archiveSession(sessionId: string): void;
  restoreSession(sessionId: string): void;
  updateSessionSetup(sessionId: string, updates: Partial<SetupSnapshot>): void;
  setSessionStep(sessionId: string, step: SessionFlowStep): void;
  updateChecklistItem(
    sessionId: string,
    listName: "safetyChecklist" | "finalChecklist",
    itemId: string,
    updates: Partial<ChecklistRecord>
  ): void;
  recordMeasurement(sessionId: string, input: MeasurementInput): MeasurementValidationResult;
  logAdjustment(sessionId: string, input: AdjustmentDraftInput): Adjustment | undefined;
  completeSession(sessionId: string, alignmentPending: boolean): void;
  requestEmailLink(email: string): Promise<boolean>;
  signInWithGoogle(): Promise<boolean>;
  signInAnonymously(): Promise<boolean>;
  signOut(): Promise<void>;
  syncGuestDataToCloud(): Promise<boolean>;
  clearLocalData(): Promise<void>;
}

export const CornerBalanceAppContext = createContext<AppContextValue | undefined>(undefined);

export function useCornerBalanceApp() {
  const context = useContext(CornerBalanceAppContext);

  if (!context) {
    throw new Error("useCornerBalanceApp must be used inside AppProviders.");
  }

  return context;
}
