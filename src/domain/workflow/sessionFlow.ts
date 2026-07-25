import { sessionFlowSteps, type SessionFlowStep } from "../types";

export function getNextSessionFlowStep(currentStep: SessionFlowStep) {
  const index = sessionFlowSteps.indexOf(currentStep);
  return sessionFlowSteps[index + 1];
}

export function getPreviousSessionFlowStep(currentStep: SessionFlowStep) {
  const index = sessionFlowSteps.indexOf(currentStep);
  return sessionFlowSteps[index - 1];
}
