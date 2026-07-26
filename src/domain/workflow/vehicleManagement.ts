import type { Session } from "../types";

export interface VehicleDeletionGuard {
  canDelete: boolean;
  relatedSessionCount: number;
  activeSessionCount: number;
  completedSessionCount: number;
  archivedSessionCount: number;
  reason?: string;
}

export function getVehicleDeletionGuard(
  vehicleId: string,
  sessions: Session[]
): VehicleDeletionGuard {
  const relatedSessions = sessions.filter((session) => session.vehicleId === vehicleId);
  const activeSessionCount = relatedSessions.filter(
    (session) => session.status === "draft" || session.status === "active"
  ).length;
  const completedSessionCount = relatedSessions.filter(
    (session) =>
      session.status === "complete" || session.status === "alignment_pending"
  ).length;
  const archivedSessionCount = relatedSessions.filter(
    (session) => session.status === "archived"
  ).length;

  if (relatedSessions.length === 0) {
    return {
      canDelete: true,
      relatedSessionCount: 0,
      activeSessionCount,
      completedSessionCount,
      archivedSessionCount
    };
  }

  return {
    canDelete: false,
    relatedSessionCount: relatedSessions.length,
    activeSessionCount,
    completedSessionCount,
    archivedSessionCount,
    reason:
      "This vehicle is referenced by saved session history. Keep the profile so reports, comparisons, and archived setups remain intact."
  };
}
