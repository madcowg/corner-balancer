import type { PropsWithChildren } from "react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { remapGuestDataToUser } from "../data/firebase/cloudState";
import {
  buildComparableStateFingerprint,
  mergeSignedInAppState
} from "../data/firebase/liveSync";
import { LocalAppRepository } from "../data/local/localAppRepository";
import { createDefaultPersistedState } from "../data/migrations/appState";
import type { PersistedAppState } from "../data/repositories/types";
import type { Adjustment, Measurement, SetupSnapshot, Vehicle } from "../domain/types";
import { validateMeasurementInput } from "../domain/validation/measurement";
import { getNextSessionFlowStep } from "../domain/workflow/sessionFlow";
import {
  getLatestNonArchivedSession,
  getRestoredSessionStatus
} from "../domain/workflow/sessionHistory";
import { getVehicleDeletionGuard } from "../domain/workflow/vehicleManagement";
import {
  createGuestOwnerId,
  createNewSession,
  createSessionFromTemplate as createTemplatedSession
} from "../features/session/defaults";
import { isFirebaseConfigured } from "../firebase/app";
import { CornerBalanceAppContext } from "./context";
import {
  type AppContextValue,
  type CloudSyncStatus,
  type SaveStatus,
  type VehicleDraftInput
} from "./context";

interface AppRuntimeState {
  ready: boolean;
  data: PersistedAppState;
  saveStatus: SaveStatus;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncMessage?: string | undefined;
  lastSavedAt?: string | undefined;
  lastCloudSyncAt?: string | undefined;
  error?: string | undefined;
}

const repository = new LocalAppRepository();
const firebaseConfigured = isFirebaseConfigured();

function createTimestamp() {
  return new Date().toISOString();
}

function hasOwnProperty<T extends object>(value: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function getLatestLiveSessionId(sessions: PersistedAppState["sessions"]) {
  return getLatestNonArchivedSession(sessions)?.id;
}

async function loadFirebaseAuthModule() {
  return import("../firebase/auth");
}

async function loadFirestoreRepositoryModule() {
  return import("../data/firebase/firestoreAppRepository");
}

function applyVehicleUpdates(vehicle: Vehicle, updates: Partial<VehicleDraftInput>): Vehicle {
  const nextVehicle: Vehicle = { ...vehicle };

  if (hasOwnProperty(updates, "nickname") && updates.nickname !== undefined) {
    const nickname = updates.nickname.trim();
    nextVehicle.nickname = nickname || vehicle.nickname;
  }

  if (hasOwnProperty(updates, "year")) {
    if (typeof updates.year === "number" && Number.isFinite(updates.year)) {
      nextVehicle.year = updates.year;
    } else {
      delete nextVehicle.year;
    }
  }

  if (hasOwnProperty(updates, "make")) {
    const make = updates.make?.trim();
    if (make) {
      nextVehicle.make = make;
    } else {
      delete nextVehicle.make;
    }
  }

  if (hasOwnProperty(updates, "model")) {
    const model = updates.model?.trim();
    if (model) {
      nextVehicle.model = model;
    } else {
      delete nextVehicle.model;
    }
  }

  if (hasOwnProperty(updates, "trim")) {
    const trim = updates.trim?.trim();
    if (trim) {
      nextVehicle.trim = trim;
    } else {
      delete nextVehicle.trim;
    }
  }

  if (hasOwnProperty(updates, "primaryUse") && updates.primaryUse !== undefined) {
    nextVehicle.primaryUse = updates.primaryUse;
  }

  if (hasOwnProperty(updates, "coiloverType") && updates.coiloverType !== undefined) {
    nextVehicle.coiloverType = updates.coiloverType;
  }

  if (
    hasOwnProperty(updates, "preferredWeightUnit") &&
    updates.preferredWeightUnit !== undefined
  ) {
    nextVehicle.preferredWeightUnit = updates.preferredWeightUnit;
  }

  if (
    hasOwnProperty(updates, "preferredHeightUnit") &&
    updates.preferredHeightUnit !== undefined
  ) {
    nextVehicle.preferredHeightUnit = updates.preferredHeightUnit;
  }

  if (hasOwnProperty(updates, "notes")) {
    const notes = updates.notes?.trim();
    if (notes) {
      nextVehicle.notes = notes;
    } else {
      delete nextVehicle.notes;
    }
  }

  return {
    ...nextVehicle,
    updatedAt: createTimestamp()
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
    ...(updates.equipmentNotes !== undefined
      ? { equipmentNotes: updates.equipmentNotes }
      : {}),
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

function filterRemoteStateForPendingVehicleDeletions(
  state: PersistedAppState,
  pendingDeletedVehicleIds: Set<string>
) {
  if (pendingDeletedVehicleIds.size === 0) {
    return state;
  }

  const vehicles = state.vehicles.filter((vehicle) => !pendingDeletedVehicleIds.has(vehicle.id));
  const sessions = state.sessions.filter(
    (session) => !pendingDeletedVehicleIds.has(session.vehicleId)
  );
  const lastSessionId =
    state.lastSessionId && sessions.some((session) => session.id === state.lastSessionId)
      ? state.lastSessionId
      : getLatestLiveSessionId(sessions);

  return {
    ...state,
    vehicles,
    sessions,
    lastSessionId
  };
}

function getGuestSyncMessage() {
  return "Guest data is still local. Choose sync when you want to merge it into Firestore.";
}

function getCloudSyncDescriptor({
  pendingGuestSync,
  hasPendingWrites,
  fromCache,
  remoteChangesApplied,
  localChangesPreserved
}: {
  pendingGuestSync: boolean;
  hasPendingWrites: boolean;
  fromCache: boolean;
  remoteChangesApplied: number;
  localChangesPreserved: number;
}) {
  if (pendingGuestSync) {
    return {
      status: "waiting_for_guest_sync" as const,
      message: getGuestSyncMessage()
    };
  }

  if (hasPendingWrites) {
    return {
      status: "syncing" as const,
      message: "Syncing changes to Firestore."
    };
  }

  if (fromCache) {
    return {
      status: "using_cache" as const,
      message: "Using Firestore cache until the network confirms the latest state."
    };
  }

  if (localChangesPreserved > 0) {
    return {
      status: "conflict" as const,
      message: "Remote differences were detected. Newer local edits were preserved."
    };
  }

  if (remoteChangesApplied > 0) {
    return {
      status: "remote_update" as const,
      message: "Changes from another device were merged into this workspace."
    };
  }

  return {
    status: "synced" as const,
    message: "Firestore sync is current."
  };
}

export function AppProviders({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppRuntimeState>({
    ready: false,
    data: createDefaultPersistedState(),
    saveStatus: "idle",
    cloudSyncStatus: "local_only"
  });
  const loadedRef = useRef(false);
  const autosaveRunIdRef = useRef(0);
  const pendingDeletedVehicleIdsRef = useRef(new Set<string>());

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
        saveStatus: "idle",
        cloudSyncStatus: "local_only"
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
          pendingDeletedVehicleIdsRef.current.clear();
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
            },
            cloudSyncStatus: "local_only",
            cloudSyncMessage: undefined,
            lastCloudSyncAt: undefined
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
          const nextAuth = {
            mode: "signed_in" as const,
            uid: user.uid,
            ...(user.email ? { email: user.email } : {}),
            ...(user.displayName ? { displayName: user.displayName } : {}),
            pendingGuestSync: hasGuestData
          };

          if (hasGuestData) {
            return {
              ...current,
              data: {
                ...current.data,
                auth: nextAuth
              },
              cloudSyncStatus: "waiting_for_guest_sync",
              cloudSyncMessage: getGuestSyncMessage()
            };
          }

          const mergedState = mergeSignedInAppState(
            {
              ...current.data,
              auth: nextAuth
            },
            cloudState
          ).mergedState;

          return {
            ...current,
            data: {
              ...mergedState,
              auth: nextAuth
            },
            cloudSyncStatus: "connecting",
            cloudSyncMessage: "Connecting to Firestore."
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
    if (
      !firebaseConfigured ||
      !state.ready ||
      state.data.auth.mode !== "signed_in" ||
      !state.data.auth.uid
    ) {
      return;
    }

    const uid = state.data.auth.uid;
    let unsubscribe = () => {};
    let cancelled = false;

    setState((current) => ({
      ...current,
      cloudSyncStatus: current.data.auth.pendingGuestSync
        ? "waiting_for_guest_sync"
        : "connecting",
      cloudSyncMessage: current.data.auth.pendingGuestSync
        ? getGuestSyncMessage()
        : "Connecting to Firestore."
    }));

    void loadFirestoreRepositoryModule().then(({ FirestoreAppRepository }) => {
      if (cancelled) {
        return;
      }

      const cloudRepository = new FirestoreAppRepository(uid);
      unsubscribe = cloudRepository.observe(
        (snapshot) => {
          if (cancelled) {
            return;
          }

          startTransition(() => {
            setState((current) => {
              if (current.data.auth.mode !== "signed_in" || current.data.auth.uid !== uid) {
                return current;
              }

              pendingDeletedVehicleIdsRef.current.forEach((vehicleId) => {
                if (!snapshot.state.vehicles.some((vehicle) => vehicle.id === vehicleId)) {
                  pendingDeletedVehicleIdsRef.current.delete(vehicleId);
                }
              });

              const remoteState = filterRemoteStateForPendingVehicleDeletions(
                snapshot.state,
                pendingDeletedVehicleIdsRef.current
              );

              if (current.data.auth.pendingGuestSync) {
                const nextSaveStatus =
                  current.saveStatus === "sync_pending" &&
                  !snapshot.hasPendingWrites &&
                  !snapshot.fromCache
                    ? "saved"
                    : current.saveStatus;
                const nextError =
                  current.saveStatus === "sync_pending" && nextSaveStatus === "saved"
                    ? undefined
                    : current.error;
                const nextCloudSyncAt = snapshot.updatedAt ?? current.lastCloudSyncAt;

                if (
                  current.cloudSyncStatus === "waiting_for_guest_sync" &&
                  current.cloudSyncMessage === getGuestSyncMessage() &&
                  current.lastCloudSyncAt === nextCloudSyncAt &&
                  current.saveStatus === nextSaveStatus &&
                  current.error === nextError
                ) {
                  return current;
                }

                return {
                  ...current,
                  cloudSyncStatus: "waiting_for_guest_sync",
                  cloudSyncMessage: getGuestSyncMessage(),
                  lastCloudSyncAt: nextCloudSyncAt,
                  saveStatus: nextSaveStatus,
                  error: nextError
                };
              }

              const mergeResult = mergeSignedInAppState(current.data, remoteState);
              const nextData = {
                ...mergeResult.mergedState,
                auth: current.data.auth
              };
              const nextCloudSyncAt = snapshot.updatedAt ?? current.lastCloudSyncAt;
              const descriptor = getCloudSyncDescriptor({
                pendingGuestSync: false,
                hasPendingWrites: snapshot.hasPendingWrites,
                fromCache: snapshot.fromCache,
                remoteChangesApplied: mergeResult.remoteChangesApplied,
                localChangesPreserved: mergeResult.localChangesPreserved
              });
              const nextSaveStatus =
                current.saveStatus === "sync_pending" &&
                !snapshot.hasPendingWrites &&
                !snapshot.fromCache
                  ? "saved"
                  : current.saveStatus;
              const nextError =
                current.saveStatus === "sync_pending" && nextSaveStatus === "saved"
                  ? undefined
                  : current.error;
              const dataChanged =
                buildComparableStateFingerprint(current.data) !==
                buildComparableStateFingerprint(nextData);

              if (
                !dataChanged &&
                current.cloudSyncStatus === descriptor.status &&
                current.cloudSyncMessage === descriptor.message &&
                current.lastCloudSyncAt === nextCloudSyncAt &&
                current.saveStatus === nextSaveStatus &&
                current.error === nextError
              ) {
                return current;
              }

              return {
                ...current,
                data: dataChanged ? nextData : current.data,
                cloudSyncStatus: descriptor.status,
                cloudSyncMessage: descriptor.message,
                lastCloudSyncAt: nextCloudSyncAt,
                saveStatus: nextSaveStatus,
                error: nextError
              };
            });
          });
        },
        (error) => {
          if (cancelled) {
            return;
          }

          const message =
            error.message || "Saved locally, but the Firestore listener needs attention.";

          startTransition(() => {
            setState((current) => ({
              ...current,
              saveStatus: current.saveStatus === "error" ? current.saveStatus : "sync_pending",
              cloudSyncStatus: "error",
              cloudSyncMessage: message,
              error: message
            }));
          });
        }
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [state.data.auth.mode, state.data.auth.pendingGuestSync, state.data.auth.uid, state.ready]);

  useEffect(() => {
    if (!state.ready || !loadedRef.current) {
      return;
    }

    const autosaveRunId = ++autosaveRunIdRef.current;
    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        saveStatus: "saving",
        error: undefined
      }));

      void repository
        .save(state.data)
        .then(() => {
          if (autosaveRunIdRef.current !== autosaveRunId) {
            return;
          }

          const savedAt = createTimestamp();
          startTransition(() => {
            setState((current) => ({
              ...current,
              saveStatus: "saved",
              lastSavedAt: savedAt,
              error: undefined
            }));
          });

          if (state.data.auth.mode !== "signed_in" || !state.data.auth.uid) {
            return;
          }

          if (state.data.auth.pendingGuestSync) {
            startTransition(() => {
              setState((current) => ({
                ...current,
                cloudSyncStatus: "waiting_for_guest_sync",
                cloudSyncMessage: getGuestSyncMessage()
              }));
            });
            return;
          }

          startTransition(() => {
            setState((current) => ({
              ...current,
              cloudSyncStatus: "syncing",
              cloudSyncMessage: "Syncing changes to Firestore."
            }));
          });

          void loadFirestoreRepositoryModule()
            .then(({ FirestoreAppRepository }) => {
              const cloudRepository = new FirestoreAppRepository(state.data.auth.uid!);
              return cloudRepository.save(state.data);
            })
            .catch((error: unknown) => {
              if (autosaveRunIdRef.current !== autosaveRunId) {
                return;
              }

              const message =
                error instanceof Error
                  ? error.message
                  : "Saved locally, but Firestore sync needs attention.";

              startTransition(() => {
                setState((current) => ({
                  ...current,
                  saveStatus: "sync_pending",
                  cloudSyncStatus: "error",
                  cloudSyncMessage: message,
                  error: message
                }));
              });
            });
        })
        .catch((error: unknown) => {
          if (autosaveRunIdRef.current !== autosaveRunId) {
            return;
          }

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
      cloudSyncStatus: state.cloudSyncStatus,
      cloudSyncMessage: state.cloudSyncMessage,
      lastSavedAt: state.lastSavedAt,
      lastCloudSyncAt: state.lastCloudSyncAt,
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
          lastSessionId: sessionId
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
        updateData((current) => ({
          ...current,
          vehicles: current.vehicles.map((vehicle) =>
            vehicle.id === vehicleId ? applyVehicleUpdates(vehicle, updates) : vehicle
          )
        }));
      },
      async deleteVehicle(vehicleId) {
        const guard = getVehicleDeletionGuard(vehicleId, state.data.sessions);
        if (!guard.canDelete) {
          return {
            ok: false,
            reason: guard.reason
          };
        }

        const vehicle = state.data.vehicles.find((entry) => entry.id === vehicleId);
        if (!vehicle) {
          return {
            ok: false,
            reason: "Vehicle not found."
          };
        }

        pendingDeletedVehicleIdsRef.current.add(vehicleId);
        updateData((current) => ({
          ...current,
          vehicles: current.vehicles.filter((entry) => entry.id !== vehicleId)
        }));

        if (
          state.data.auth.mode !== "signed_in" ||
          !state.data.auth.uid ||
          state.data.auth.pendingGuestSync
        ) {
          pendingDeletedVehicleIdsRef.current.delete(vehicleId);
          return {
            ok: true,
            ...(state.data.auth.pendingGuestSync
              ? {
                  message:
                    "Vehicle removed locally. Guest data stays on this device until you choose to sync it."
                }
              : {})
          };
        }

        try {
          const { FirestoreAppRepository } = await loadFirestoreRepositoryModule();
          const cloudRepository = new FirestoreAppRepository(state.data.auth.uid);
          await cloudRepository.deleteVehicle(vehicleId);

          return {
            ok: true
          };
        } catch (error) {
          pendingDeletedVehicleIdsRef.current.delete(vehicleId);
          const message =
            error instanceof Error
              ? error.message
              : "Vehicle removed locally, but Firestore delete needs attention.";

          startTransition(() => {
            setState((current) => ({
              ...current,
              saveStatus: "sync_pending",
              cloudSyncStatus: "error",
              cloudSyncMessage: message,
              error: message
            }));
          });

          return {
            ok: true,
            message:
              "Vehicle removed locally. Cloud deletion needs attention before the profile disappears on other devices."
          };
        }
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
      createSessionFromTemplate(sessionId) {
        const sourceSession = state.data.sessions.find((entry) => entry.id === sessionId);
        if (!sourceSession) {
          return undefined;
        }

        const vehicle = state.data.vehicles.find((entry) => entry.id === sourceSession.vehicleId);
        if (!vehicle) {
          return undefined;
        }

        const session = createTemplatedSession(sourceSession, vehicle);
        updateData((current) => ({
          ...current,
          sessions: [...current.sessions, session],
          lastSessionId: session.id
        }));

        return session;
      },
      archiveSession(sessionId) {
        updateData((current) => {
          const updatedSessions = current.sessions.map((session) =>
            session.id === sessionId && session.status !== "archived"
              ? {
                  ...session,
                  archivedFromStatus: session.status,
                  status: "archived" as const,
                  updatedAt: createTimestamp()
                }
              : session
          );

          const nextLastSessionId =
            current.lastSessionId === sessionId
              ? getLatestLiveSessionId(updatedSessions)
              : current.lastSessionId;

          return {
            ...current,
            sessions: updatedSessions,
            lastSessionId: nextLastSessionId
          };
        });
      },
      restoreSession(sessionId) {
        updateData((current) => ({
          ...current,
          lastSessionId: sessionId,
          sessions: current.sessions.map((session) =>
            session.id === sessionId && session.status === "archived"
              ? (() => {
                  const { archivedFromStatus: _archivedFromStatus, ...restoredSession } = session;

                  return {
                    ...restoredSession,
                    status: getRestoredSessionStatus(session),
                    updatedAt: createTimestamp()
                  };
                })()
              : session
          )
        }));
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
                  baselineSetupSnapshot: entry.baselineSetupSnapshot ?? entry.setupSnapshot,
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

        setState((current) => ({
          ...current,
          cloudSyncStatus: "syncing",
          cloudSyncMessage: "Syncing guest data to Firestore."
        }));

        const userId = state.data.auth.uid;
        const guestOwnerId = createGuestOwnerId();
        const { FirestoreAppRepository } = await loadFirestoreRepositoryModule();
        const cloudRepository = new FirestoreAppRepository(userId);
        const remappedState: PersistedAppState = remapGuestDataToUser(
          state.data,
          guestOwnerId,
          userId,
          createTimestamp()
        );
        const cloudState = await cloudRepository.load();
        const mergedState = mergeSignedInAppState(remappedState, cloudState).mergedState;

        await cloudRepository.save(mergedState);
        updateData(() => mergedState);
        return true;
      },
      async clearLocalData() {
        pendingDeletedVehicleIdsRef.current.clear();
        await repository.clear();
        setState({
          ready: true,
          data: createDefaultPersistedState(),
          saveStatus: "idle",
          cloudSyncStatus: "local_only"
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
