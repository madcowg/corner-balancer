import type { Session, SessionFlowStep, SessionStatus } from "../types";

export type ActiveSessionFilter = "all" | "active" | "completed" | "archived";
type RestoredSessionStatus = Exclude<SessionStatus, "archived">;

export function sortSessionsByUpdatedAt(sessions: Session[]) {
  return sessions
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getLatestNonArchivedSession(sessions: Session[]) {
  return sortSessionsByUpdatedAt(sessions).find((session) => session.status !== "archived");
}

export function getSessionLaunchStep(session: Session): SessionFlowStep {
  return session.status === "complete" || session.status === "alignment_pending"
    ? "report"
    : session.currentStep;
}

export function filterSessionsByStatus(
  sessions: Session[],
  filter: ActiveSessionFilter
) {
  return sortSessionsByUpdatedAt(sessions).filter((session) => {
    if (filter === "all") {
      return true;
    }

    if (filter === "active") {
      return session.status === "draft" || session.status === "active";
    }

    if (filter === "completed") {
      return session.status === "complete" || session.status === "alignment_pending";
    }

    return session.status === "archived";
  });
}

export function getRestoredSessionStatus(session: Session): RestoredSessionStatus {
  if (session.archivedFromStatus) {
    return session.archivedFromStatus;
  }

  if (session.completedAt) {
    return session.currentStep === "report" ? "complete" : "alignment_pending";
  }

  if (session.measurements.length > 0 || session.adjustments.length > 0) {
    return "active";
  }

  return "draft";
}
