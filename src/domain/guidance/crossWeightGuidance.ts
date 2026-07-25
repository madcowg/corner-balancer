import type { CalculatedMetrics, CoiloverType, Corner, CrossConvention } from "../types";
import { getCrossLabel } from "../types";

export interface GuidanceAction {
  corner: Corner;
  direction: "increase_supported_load" | "decrease_supported_load";
  summary: string;
}

export interface CrossWeightGuidance {
  status: "below" | "above" | "within" | "identify_architecture";
  headline: string;
  message: string;
  disclaimer: string;
  diagonalLabel: string;
  oppositeDiagonalLabel: string;
  actions: GuidanceAction[];
  selectedCrossPct: number;
  targetCrossPct: number;
  errorPct: number;
}

export interface CrossWeightGuidanceInput {
  calculations: CalculatedMetrics;
  targetCrossPct: number;
  tolerancePct: number;
  selectedCrossConvention: CrossConvention;
  coiloverType: CoiloverType;
}

export function getCrossWeightGuidance({
  calculations,
  targetCrossPct,
  tolerancePct,
  selectedCrossConvention,
  coiloverType
}: CrossWeightGuidanceInput): CrossWeightGuidance {
  const diagonalLabel = getCrossLabel(selectedCrossConvention);
  const oppositeDiagonalLabel = diagonalLabel === "LF+RR" ? "RF+LR" : "LF+RR";
  const delta = calculations.selectedCrossPct - targetCrossPct;
  const absoluteDelta = Math.abs(delta);

  if (absoluteDelta <= tolerancePct) {
    return {
      status: "within",
      headline: "Cross weight is within tolerance",
      message:
        "Do not automatically chase the number. Review ride-height balance, rake, repeatability, and the intended use before making another change.",
      disclaimer:
        "Any further mechanical change still requires a controlled resettle and a fresh measurement.",
      diagonalLabel,
      oppositeDiagonalLabel,
      actions: [],
      selectedCrossPct: calculations.selectedCrossPct,
      targetCrossPct,
      errorPct: delta
    };
  }

  if (coiloverType === "unknown") {
    return {
      status: "identify_architecture",
      headline: "Identify the suspension architecture before turning anything",
      message:
        "The app can describe the expected diagonal direction, but it will not claim a universal perch-turn instruction when the adjuster architecture is unknown.",
      disclaimer:
        "Confirm whether the car uses a spring seat, lower-mount height adjustment, torsion-bar adjuster, shim stack, or another system before logging a corner-specific change.",
      diagonalLabel,
      oppositeDiagonalLabel,
      actions: [],
      selectedCrossPct: calculations.selectedCrossPct,
      targetCrossPct,
      errorPct: delta
    };
  }

  const increasingCorners = selectedCrossConvention === "LF_RR" ? (["LF", "RR"] as const) : (["RF", "LR"] as const);
  const decreasingCorners = selectedCrossConvention === "LF_RR" ? (["RF", "LR"] as const) : (["LF", "RR"] as const);
  const belowTarget = delta < 0;
  const primaryCorners = belowTarget ? increasingCorners : decreasingCorners;
  const secondaryCorners = belowTarget ? decreasingCorners : increasingCorners;

  return {
    status: belowTarget ? "below" : "above",
    headline: belowTarget
      ? `${diagonalLabel} is below target`
      : `${diagonalLabel} is above target`,
    message: belowTarget
      ? `Generally, increase supported load on ${diagonalLabel} or reduce it on ${oppositeDiagonalLabel}.`
      : `Generally, reduce supported load on ${diagonalLabel} or increase it on ${oppositeDiagonalLabel}.`,
    disclaimer:
      "This is qualitative guidance only. Small measured changes, resettling, and a fresh measurement are required after every adjustment.",
    diagonalLabel,
    oppositeDiagonalLabel,
    actions: [
      ...primaryCorners.map<GuidanceAction>((corner) => ({
        corner,
        direction: belowTarget ? "increase_supported_load" : "decrease_supported_load",
        summary: belowTarget
          ? `Increase supported load at ${corner} if the hardware and procedure support it.`
          : `Reduce supported load at ${corner} if the hardware and procedure support it.`
      })),
      ...secondaryCorners.map<GuidanceAction>((corner) => ({
        corner,
        direction: belowTarget ? "decrease_supported_load" : "increase_supported_load",
        summary: belowTarget
          ? `Reduce supported load at ${corner} if that is the safer path for the setup.`
          : `Increase supported load at ${corner} if that is the safer path for the setup.`
      }))
    ],
    selectedCrossPct: calculations.selectedCrossPct,
    targetCrossPct,
    errorPct: delta
  };
}
