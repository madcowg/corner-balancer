import type { PropsWithChildren } from "react";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import type {
  Adjustment,
  AdjustmentAmountUnit,
  AdjustmentDirection,
  AdjustmentType,
  ChecklistRecord,
  CoiloverType,
  Corner,
  Measurement,
  Session,
  SessionFlowStep,
  SetupSnapshot,
  Vehicle,
  VehicleUse
} from "../domain/types";
import { getNextSessionFlowStep } from "../domain/workflow/sessionFlow";
import { validateMeasurementInput, type MeasurementInput } from "../domain/validation/measurement";
import { LocalAppRepository } from "../data/local/localAppRepository";
import type { PersistedAppState } from "../data/repositories/types";
import { createDefaultPersistedState } from "../data/migrations/appState";
import { createGuestOwnerId, createNewSession } from "../features/session/defaults";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AppRuntimeState {
  ready: boolean;
  data: PersistedAppState;
  saveStatus: SaveStatus;
  lastSavedAt?: string | undefined;
  error?: string | undefined;
}

interface VehicleDraftInput {
  nickname: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  primaryUse: VehicleUse;
  coiloverType: CoiloverType;
  preferredWeightUnit: Vehicle["preferredWeightUnit"];
  preferredHeightUnit: Vehicle["preferredHeightUnit"];
  notes?: string;
}

interface AdjustmentDraftInput {
  corner: Corner;
  adjusterType: AdjustmentType;
  direction: AdjustmentDirection;
  amount: number;
  amountUnit: AdjustmentAmountUnit;
  reason: string;
}

interface AppContextValue {
  ready: boolean;
  firebaseConfigured: boolean;
  auth: PersistedAppState["auth"];
  vehicles: Vehicle[];
  sessions: Session[];
  lastSessionId?: string | undefined;
  saveStatus: SaveStatus;
  lastSavedAt?: string | undefined;
  error?: string | undefined;
  getVehicle(vehicleId: string): Vehicle | undefined;
  getSession(sessionId: string): Session | undefined;
  setLastSessionId(sessionId?: string): void;
  createVehicle(input: VehicleDraftInput): Vehicle;
  updateVehicle(vehicleId: string, updates: Partial<VehicleDraftInput>): void;
  createSession(vehicleId: string): Session | undefined;
  updateSessionSetup(sessionId: string, updates: Partial<SetupSnapshot>): void;
  setSessionStep(sessionId: string, step: SessionFlowStep): void;
  updateChecklistItem(
    sessionId: string,
    listName: "safetyChecklist" | "finalChecklist",
    itemId: string,
    updates: Partial<ChecklistRecord>
  ): void;
  recordMeasurement(sessionId: string, input: MeasurementInput): ReturnType<typeof validateMeasurementInput>;
  logAdjustment(sessionId: string, input: AdjustmentDraftInput): Adjustment | undefined;
  completeSession(sessionId: string, alignmentPending: boolean): void;
  requestEmailLink(email: string): Promise<boolean>;
  signInWithGoogle(): Promise<boolean>;
  signInAnonymously(): Promise<boolean>;
  signOut(): Promise<void>;
  syncGuestDataToCloud(): Promise<boolean>;
  clearLocalData(): Promise<void>;
}

const CornerBalanceAppContext = createContext<AppContextValue | undefined>(undefined);
const repository = new LocalAppRepository();
const firebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
);

function createTimestamp() {
  return new Date().toISOString();
}

function mergeById<T extends { id: string }>(localItems: T[], remoteItems: T[]) {
  const merged = new Map<string, T>();
  remoteItems.forEach((item) => merged.set(item.id, item));
  localItems.forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
}

async function loadFirebaseAuthModule() {
  return import("../firebase/auth");
}

async function loadFirestoreRepositoryModule() {
  return import("../data/firebase/firestoreAppRepository");
}

function compactVehicleUpdates(
  updates: Partial<VehicleDraftInput>
): Partial<Vehicle> {
  return {
    ...(updates.nickname !== undefined ? { nickname: updates.nickname } : {}),
    ...(updates.year !== undefined ? { year: updates.year } : {}),
    ...(updates.make !== undefined ? { make: updates.make } : {}),
    ...(updates.model !== undefined ? { model: updates.model } : {}),
    ...(updates.trim !== undefined ? { trim: updates.trim } : {}),
    ...(updates.primaryUse !== undefined ? { primaryUse: updates.primaryUse } : {}),
    ...(updates.coiloverType !== undefined ? { coiloverType: updates.coiloverType } : {}),
    ...(updates.preferredWeightUnit !== undefined
      ? { preferredWeightUnit: updates.preferredWeightUnit }
      : {}),
    ...(updates.preferredHeightUnit !== undefined
      ? { preferredHeightUnit: updates.preferredHeightUnit }
      : {}),
    ...(updates.notes !== undefined ? { notes: updates.notes } : {})
  };
}

function compactSetupUpdates(updates: Partial<SetupSnapshot>): Partial<SetupSnapshot> {
  return {
    ...(updates.version !== undefined ? { version: updates.version } : {}),
    ...(updates.eventType !== undefined ? { eventType: updates.eventType } : {}),
    ...(updates.weightUnit !== undefined ? { weightUnit: updates.weightUnit } : {}),
    ...(updates.heightUnit !== undefined ? { heightUnit: updates.heightUnit } : {}),
    ...(updates.pressureUnit !== undefined ? { pressureUnit: updates.pressureUnit } : {}),
    ...(updates.targetCrossPct !== undefined ? { targetCrossPct: updates.targetCrossPct } : {}),
    ...(updates.crossTolerancePct !== undefined
      ? { crossTolerancePct: updates.crossTolerancePct }
      : {}),
    ...(updates.selectedCrossConvention !== undefined
      ? { selectedCrossConvention: updates.selectedCrossConvention }
      : {}),
    ...(updates.targetRideHeightsMm !== undefined
      ? { targetRideHeightsMm: updates.targetRideHeightsMm }
      : {}),
    ...(updates.sideHeightToleranceMm !== undefined
      ? { sideHeightToleranceMm: updates.sideHeightToleranceMm }
      : {}),
    ...(updates.rakeTargetMm !== undefined ? { rakeTargetMm: updates.rakeTargetMm } : {}),
    ...(updates.driverOrBallastKg !== undefined
      ? { driverOrBallastKg: updates.driverOrBallastKg }
      : {}),
    ...(updates.fuelDescription !== undefined ? { fuelDescription: updates.fuelDescription } : {}),
    ...(updates.equipmentNotes !== undefined ? { equipmentNotes: updates.equipmentNotes } : {}),
    ...(updates.tirePressuresPsi !== undefined
      ? { tirePressuresPsi: updates.tirePressuresPsi }
      : {}),
    ...(updates.damperSettings !== undefined ? { damperSettings: updates.damperSettings } : {}),
    ...(updates.ballastDescription !== undefined
      ? { ballastDescription: updates.ballastDescription }
      : {}),
    ...(updates.swayBarState !== undefined ? { swayBarState: updates.swayBarState } : {})
  };
}

export function AppProviders({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppRuntimeState>({
    ready: false,
    data: createDefaultPersistedState(),
    saveStatus: "idle"
  });
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void repository.load().then((data) => {
      if (cancelled) {
        return;
      }

      loadedRef.current = true;
      setState({
        ready: true,
        data,
        saveStatus: "idle"
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }

    void loadFirebaseAuthModule().then(({ consumeEmailLinkSignInFromWindow }) =>
      consumeEmailLinkSignInFromWindow()
    );
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }

    let unsubscribe = () => {};
    let cancelled = false;

    void loadFirebaseAuthModule().then(({ observeFirebaseAuth }) => {
      if (cancelled) {
        return;
      }

      unsubscribe = observeFirebaseAuth(async (user) => {
        if (!user) {
          setState((current) => ({
            ...current,
            data: {
              ...current.data,
              auth: {
                mode:
                  current.data.vehicles.length > 0 || current.data.sessions.length > 0
                    ? "guest"
                    : "signed_out",
                pendingGuestSync: false
              }
            }
          }));
          return;
        }

        const guestOwnerId = createGuestOwnerId();
        const { FirestoreAppRepository } = await loadFirestoreRepositoryModule();
        const cloudRepository = new FirestoreAppRepository(user.uid);
        const cloudState = await cloudRepository.load();

        setState((current) => {
          const hasGuestData =
            current.data.vehicles.some((vehicle) => vehicle.ownerId === guestOwnerId) ||
            current.data.sessions.some((session) => session.ownerId === guestOwnerId);

          return {
            ...current,
            data: {
              ...current.data,
              auth: {
                mode: "signed_in",
                uid: user.uid,
                ...(user.email ? { email: user.email } : {}),
                ...(user.displayName ? { displayName: user.displayName } : {}),
                pendingGuestSync: hasGuestData
              },
              vehicles: hasGuestData ? current.data.vehicles : cloudState.vehicles,
              sessions: hasGuestData ? current.data.sessions : cloudState.sessions,
              lastSessionId: hasGuestData ? current.data.lastSessionId : cloudState.lastSessionId
            }
          };
        });
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!state.ready || !loadedRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        saveStatus: "saving",
        error: undefined
      }));

      void repository
        .save(state.data)
        .then(() => {
          startTransition(() => {
            setState((current) => ({
              ...current,
              saveStatus: "saved",
              lastSavedAt: createTimestamp()
            }));
          });
        })
        .catch((error: unknown) => {
          startTransition(() => {
            setState((current) => ({
              ...current,
              saveStatus: "error",
              error: error instanceof Error ? error.message : "Unable to save local data."
            }));
          });
        });
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.data, state.ready]);

  function updateData(updater: (current: PersistedAppState) => PersistedAppState) {
    setState((current) => ({
      ...current,
      data: updater(current.data),
      saveStatus: current.ready ? "saving" : current.saveStatus
    }));
  }

  const contextValue = useMemo<AppContextValue>(
    () => ({
      ready: state.ready,
      firebaseConfigured,
      auth: state.data.auth,
      vehicles: state.data.vehicles,
      sessions: state.data.sessions,
      lastSessionId: state.data.lastSessionId,
      saveStatus: state.saveStatus,
      lastSavedAt: state.lastSavedAt,
      error: state.error,
      getVehicle(vehicleId) {
        return state.data.vehicles.find((vehicle) => vehicle.id === vehicleId);
      },
      getSession(sessionId) {
        return state.data.sessions.find((session) => session.id === sessionId);
      },
      setLastSessionId(sessionId) {
        updateData((current) => ({
          ...current,
          ...(sessionId ? { lastSessionId: sessionId } : {})
        }));
      },
      createVehicle(input) {
        const timestamp = createTimestamp();
        const vehicle: Vehicle = {
          id: crypto.randomUUID(),
          ownerId: state.data.auth.uid ?? createGuestOwnerId(),
          nickname: input.nickname.trim(),
          primaryUse: input.primaryUse,
          coiloverType: input.coiloverType,
          preferredWeightUnit: input.preferredWeightUnit,
          preferredHeightUnit: input.preferredHeightUnit,
          createdAt: timestamp,
          updatedAt: timestamp,
          ...(input.year ? { year: input.year } : {}),
          ...(input.make?.trim() ? { make: input.make.trim() } : {}),
          ...(input.model?.trim() ? { model: input.model.trim() } : {}),
          ...(input.trim?.trim() ? { trim: input.trim.trim() } : {}),
          ...(input.notes?.trim() ? { notes: input.notes.trim() } : {})
        };

        updateData((current) => ({
          ...current,
          vehicles: [...current.vehicles, vehicle]
        }));

        return vehicle;
      },
      updateVehicle(vehicleId, updates) {
        const sanitizedUpdates = compactVehicleUpdates(updates);
        updateData((current) => ({
          ...current,
          vehicles: current.vehicles.map((vehicle) =>
            vehicle.id === vehicleId
              ? {
                  ...vehicle,
                  ...sanitizedUpdates,
                  updatedAt: createTimestamp()
                }
              : vehicle
          )
        }));
      },
      createSession(vehicleId) {
        const vehicle = state.data.vehicles.find((entry) => entry.id === vehicleId);
        if (!vehicle) {
          return undefined;
        }

        const session = createNewSession(vehicle);
        updateData((current) => ({
          ...current,
          sessions: [...current.sessions, session],
          lastSessionId: session.id
        }));

        return session;
      },
      updateSessionSetup(sessionId, updates) {
        const sanitizedUpdates = compactSetupUpdates(updates);
        updateData((current) => ({
          ...current,
          sessions: current.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  setupSnapshot: {
                    ...session.setupSnapshot,
                    ...sanitizedUpdates
                  },
                  targetCrossPct: sanitizedUpdates.targetCrossPct ?? session.targetCrossPct,
                  crossTolerancePct:
                    sanitizedUpdates.crossTolerancePct ?? session.crossTolerancePct,
                  sideHeightToleranceMm:
                    sanitizedUpdates.sideHeightToleranceMm ?? session.sideHeightToleranceMm,
                  updatedAt: createTimestamp()
                }
              : session
          )
        }));
      },
      setSessionStep(sessionId, step) {
        updateData((current) => ({
          ...current,
          lastSessionId: sessionId,
          sessions: current.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, currentStep: step, updatedAt: createTimestamp() }
              : session
          )
        }));
      },
      updateChecklistItem(sessionId, listName, itemId, updates) {
        updateData((current) => ({
          ...current,
          sessions: current.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  [listName]: session[listName].map((item) =>
                    item.id === itemId
                      ? {
                          ...item,
                          ...updates,
                          updatedAt: createTimestamp()
                        }
                      : item
                  ),
                  updatedAt: createTimestamp()
                }
              : session
          )
        }));
      },
      recordMeasurement(sessionId, input) {
        const session = state.data.sessions.find((entry) => entry.id === sessionId);
        if (!session) {
          return { valid: false, errors: ["Session not found."], warnings: [] };
        }

        const baselineMeasurement = session.measurements[0];
        const baselineSetup = session.baselineSetupSnapshot ?? session.setupSnapshot;
        const validation = validateMeasurementInput(input, {
          ...(baselineMeasurement
            ? { baselineTotalKg: baselineMeasurement.calculations.totalKg }
            : {}),
          ...(baselineSetup.tirePressuresPsi
            ? { baselineTirePressuresPsi: baselineSetup.tirePressuresPsi }
            : {}),
          baselineFuelDescription: baselineSetup.fuelDescription,
          currentFuelDescription: session.setupSnapshot.fuelDescription,
          ...(baselineSetup.ballastDescription
            ? { baselineBallastDescription: baselineSetup.ballastDescription }
            : {}),
          ...(session.setupSnapshot.ballastDescription
            ? { currentBallastDescription: session.setupSnapshot.ballastDescription }
            : {}),
          ...(baselineSetup.damperSettings
            ? { baselineDamperSettings: baselineSetup.damperSettings }
            : {}),
          ...(session.setupSnapshot.damperSettings
            ? { currentDamperSettings: session.setupSnapshot.damperSettings }
            : {}),
          totalDriftWarningPct: session.totalDriftWarningPct
        });

        if (!validation.valid || !validation.normalized || !validation.calculations) {
          return validation;
        }

        const measurement: Measurement = {
          id: crypto.randomUUID(),
          sequence: session.measurements.length,
          weightsKg: validation.normalized.weightsKg,
          calculations: validation.calculations,
          settled: input.settled,
          valid: validation.valid,
          warnings: validation.warnings,
          createdAt: createTimestamp(),
          ...(validation.normalized.rideHeightsMm
            ? { rideHeightsMm: validation.normalized.rideHeightsMm }
            : {}),
          ...(validation.normalized.tirePressuresPsi
            ? { tirePressuresPsi: validation.normalized.tirePressuresPsi }
            : {})
        };

        updateData((current) => ({
          ...current,
          lastSessionId: sessionId,
          sessions: current.sessions.map((entry) =>
            entry.id === sessionId
              ? {
                  ...entry,
                  status: "active",
                  currentStep: "results",
                  measurements: [...entry.measurements, measurement],
                  baselineSetupSnapshot:
                    entry.baselineSetupSnapshot ?? entry.setupSnapshot,
                  updatedAt: createTimestamp()
                }
              : entry
          )
        }));

        return validation;
      },
      logAdjustment(sessionId, input) {
        const session = state.data.sessions.find((entry) => entry.id === sessionId);
        const lastMeasurement = session?.measurements.at(-1);

        if (!session || !lastMeasurement) {
          return undefined;
        }

        const adjustment: Adjustment = {
          id: crypto.randomUUID(),
          afterMeasurementId: lastMeasurement.id,
          corner: input.corner,
          adjusterType: input.adjusterType,
          direction: input.direction,
          amount: input.amount,
          amountUnit: input.amountUnit,
          reason: input.reason.trim(),
          createdAt: createTimestamp()
        };

        updateData((current) => ({
          ...current,
          lastSessionId: sessionId,
          sessions: current.sessions.map((entry) =>
            entry.id === sessionId
              ? {
                  ...entry,
                  adjustments: [...entry.adjustments, adjustment],
                  currentStep: getNextSessionFlowStep("adjust") ?? "settle",
                  updatedAt: createTimestamp()
                }
              : entry
          )
        }));

        return adjustment;
      },
      completeSession(sessionId, alignmentPending) {
        updateData((current) => ({
          ...current,
          lastSessionId: sessionId,
          sessions: current.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  status: alignmentPending ? "alignment_pending" : "complete",
                  currentStep: "report",
                  completedAt: createTimestamp(),
                  updatedAt: createTimestamp()
                }
              : session
          )
        }));
      },
      async requestEmailLink(email) {
        if (!firebaseConfigured || !email.trim()) {
          return false;
        }

        const { requestEmailLinkSignIn } = await loadFirebaseAuthModule();
        return requestEmailLinkSignIn(email.trim());
      },
      async signInWithGoogle() {
        if (!firebaseConfigured) {
          return false;
        }

        const { signInWithGooglePopup } = await loadFirebaseAuthModule();
        return signInWithGooglePopup();
      },
      async signInAnonymously() {
        if (!firebaseConfigured) {
          return false;
        }

        const { signInAnonymouslyInFirebase } = await loadFirebaseAuthModule();
        return signInAnonymouslyInFirebase();
      },
      async signOut() {
        const { signOutFromFirebase } = await loadFirebaseAuthModule();
        await signOutFromFirebase();
      },
      async syncGuestDataToCloud() {
        if (state.data.auth.mode !== "signed_in" || !state.data.auth.uid) {
          return false;
        }

        const userId = state.data.auth.uid;
        const guestOwnerId = createGuestOwnerId();
        const { FirestoreAppRepository } = await loadFirestoreRepositoryModule();
        const cloudRepository = new FirestoreAppRepository(userId);
        const remappedState: PersistedAppState = {
          ...state.data,
          auth: {
            ...state.data.auth,
            mode: "signed_in",
            uid: userId,
            pendingGuestSync: false
          },
          vehicles: state.data.vehicles.map((vehicle) =>
            vehicle.ownerId === guestOwnerId
              ? { ...vehicle, ownerId: userId, updatedAt: createTimestamp() }
              : vehicle
          ),
          sessions: state.data.sessions.map((session) =>
            session.ownerId === guestOwnerId
              ? { ...session, ownerId: userId, updatedAt: createTimestamp() }
              : session
          )
        };
        const cloudState = await cloudRepository.load();
        const mergedState: PersistedAppState = {
          ...remappedState,
          vehicles: mergeById(remappedState.vehicles, cloudState.vehicles),
          sessions: mergeById(remappedState.sessions, cloudState.sessions),
          lastSessionId: remappedState.lastSessionId ?? cloudState.lastSessionId
        };

        await cloudRepository.save(mergedState);
        updateData(() => mergedState);
        return true;
      },
      async clearLocalData() {
        await repository.clear();
        setState({
          ready: true,
          data: createDefaultPersistedState(),
          saveStatus: "idle"
        });
      }
    }),
    [state]
  );

  return (
    <CornerBalanceAppContext.Provider value={contextValue}>
      {children}
    </CornerBalanceAppContext.Provider>
  );
}

export function useCornerBalanceApp() {
  const context = useContext(CornerBalanceAppContext);

  if (!context) {
    throw new Error("useCornerBalanceApp must be used inside AppProviders.");
  }

  return context;
}
