import type { Session, Vehicle } from "../../domain/types";
import { getLatestNonArchivedSession } from "../../domain/workflow/sessionHistory";
import type { PersistedAppState } from "../repositories/types";

type SyncEntity = Vehicle | Session;

export interface SignedInStateMergeResult {
  mergedState: PersistedAppState;
  remoteChangesApplied: number;
  localChangesPreserved: number;
  hasConflict: boolean;
}

function compareUpdatedAt(
  left?: { updatedAt: string },
  right?: { updatedAt: string }
) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return -1;
  }

  if (!right) {
    return 1;
  }

  return left.updatedAt.localeCompare(right.updatedAt);
}

function areEntitiesEqual(left: SyncEntity, right: SyncEntity) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortById<T extends { id: string }>(items: T[]) {
  return items.slice().sort((left, right) => left.id.localeCompare(right.id));
}

function chooseSessionReference(
  mergedSessions: Session[],
  localLastSessionId?: string,
  remoteLastSessionId?: string
) {
  const candidates = [localLastSessionId, remoteLastSessionId]
    .filter((value): value is string => Boolean(value))
    .map((sessionId) => mergedSessions.find((session) => session.id === sessionId))
    .filter((session): session is Session => Boolean(session))
    .filter((session) => session.status !== "archived");

  if (candidates.length === 0) {
    return getLatestNonArchivedSession(mergedSessions)?.id;
  }

  return candidates.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.id;
}

function mergeUpdatedCollection<T extends SyncEntity>(
  localItems: T[],
  remoteItems: T[]
) {
  const ids = new Set([...localItems.map((item) => item.id), ...remoteItems.map((item) => item.id)]);
  const localById = new Map(localItems.map((item) => [item.id, item]));
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]));
  const merged: T[] = [];
  let remoteChangesApplied = 0;
  let localChangesPreserved = 0;
  let hasConflict = false;

  [...ids].forEach((id) => {
    const localItem = localById.get(id);
    const remoteItem = remoteById.get(id);

    if (!localItem && remoteItem) {
      merged.push(remoteItem);
      remoteChangesApplied += 1;
      return;
    }

    if (localItem && !remoteItem) {
      merged.push(localItem);
      return;
    }

    if (!localItem || !remoteItem) {
      return;
    }

    if (areEntitiesEqual(localItem, remoteItem)) {
      merged.push(localItem);
      return;
    }

    const updatedAtComparison = compareUpdatedAt(localItem, remoteItem);
    if (updatedAtComparison < 0) {
      merged.push(remoteItem);
      remoteChangesApplied += 1;
      hasConflict = true;
      return;
    }

    if (updatedAtComparison > 0) {
      merged.push(localItem);
      localChangesPreserved += 1;
      hasConflict = true;
      return;
    }

    merged.push(localItem);
    localChangesPreserved += 1;
    hasConflict = true;
  });

  return {
    merged: sortById(merged),
    remoteChangesApplied,
    localChangesPreserved,
    hasConflict
  };
}

export function mergeSignedInAppState(
  localState: PersistedAppState,
  remoteState: PersistedAppState
): SignedInStateMergeResult {
  const vehicleMerge = mergeUpdatedCollection(localState.vehicles, remoteState.vehicles);
  const sessionMerge = mergeUpdatedCollection(localState.sessions, remoteState.sessions);
  const mergedSessions = sessionMerge.merged as PersistedAppState["sessions"];

  return {
    mergedState: {
      ...localState,
      version: Math.max(localState.version, remoteState.version),
      vehicles: vehicleMerge.merged as PersistedAppState["vehicles"],
      sessions: mergedSessions,
      lastSessionId: chooseSessionReference(
        mergedSessions,
        localState.lastSessionId,
        remoteState.lastSessionId
      )
    },
    remoteChangesApplied:
      vehicleMerge.remoteChangesApplied + sessionMerge.remoteChangesApplied,
    localChangesPreserved:
      vehicleMerge.localChangesPreserved + sessionMerge.localChangesPreserved,
    hasConflict: vehicleMerge.hasConflict || sessionMerge.hasConflict
  };
}

export function buildComparableStateFingerprint(state: PersistedAppState) {
  return JSON.stringify({
    version: state.version,
    lastSessionId: state.lastSessionId ?? null,
    vehicles: sortById(state.vehicles),
    sessions: sortById(state.sessions)
  });
}
