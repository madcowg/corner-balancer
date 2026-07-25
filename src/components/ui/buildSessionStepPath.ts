import type { SessionFlowStep } from "../../domain/types";

export function buildSessionStepPath(sessionId: string, step: SessionFlowStep) {
  return `/session/${sessionId}/${step}`;
}
