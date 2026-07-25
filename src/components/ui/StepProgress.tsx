import { NavLink } from "react-router-dom";

import { sessionFlowSteps, type SessionFlowStep } from "../../domain/types";
import { buildSessionStepPath } from "./buildSessionStepPath";

const stepLabels: Record<SessionFlowStep, string> = {
  setup: "Setup",
  workspace: "Workspace",
  "vehicle-prep": "Prep",
  baseline: "Baseline",
  results: "Results",
  adjust: "Adjust",
  settle: "Settle",
  finalize: "Finalize",
  report: "Report"
};

export interface StepProgressProps {
  currentStep: SessionFlowStep;
  sessionId: string;
}

export function StepProgress({ currentStep, sessionId }: StepProgressProps) {
  const currentIndex = sessionFlowSteps.indexOf(currentStep);

  return (
    <nav aria-label="Session progress" className="overflow-x-auto">
      <ol className="flex min-w-max gap-2">
        {sessionFlowSteps.map((step, index) => (
          <li key={step}>
            <NavLink
              to={buildSessionStepPath(sessionId, step)}
              className={({ isActive }) =>
                [
                  "flex min-h-11 items-center rounded-full border px-3 py-2 text-small font-semibold transition-colors",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : index < currentIndex
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
                ].join(" ")
              }
            >
              {stepLabels[step]}
            </NavLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
