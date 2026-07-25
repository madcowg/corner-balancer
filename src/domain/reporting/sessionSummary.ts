import type { ChecklistRecord, Session } from "../types";

export interface ChecklistSummary {
  total: number;
  checked: number;
  unresolved: number;
  overridden: number;
  blockedOpen: number;
  criticalOpen: number;
}

export interface SessionSummary {
  measurementCount: number;
  adjustmentCount: number;
  latestWarnings: string[];
  warningCount: number;
  targetCrossPct: number;
  crossTolerancePct: number;
  baselineCrossPct?: number;
  finalCrossPct?: number;
  crossChangePct?: number;
  finalCrossErrorPct?: number;
  withinCrossTolerance?: boolean;
  baselineTotalKg?: number;
  finalTotalKg?: number;
  totalChangeKg?: number;
  baselineRakeMm?: number;
  finalRakeMm?: number;
  rakeChangeMm?: number;
  safetyChecklist: ChecklistSummary;
  finalChecklist: ChecklistSummary;
}

export function summarizeChecklist(checklist: ChecklistRecord[]): ChecklistSummary {
  return checklist.reduce<ChecklistSummary>(
    (summary, item) => {
      const overridden = !item.checked && Boolean(item.overrideReason?.trim());

      return {
        total: summary.total + 1,
        checked: summary.checked + (item.checked ? 1 : 0),
        unresolved: summary.unresolved + (!item.checked ? 1 : 0),
        overridden: summary.overridden + (overridden ? 1 : 0),
        blockedOpen: summary.blockedOpen + (!item.checked && item.severity === "blocked" ? 1 : 0),
        criticalOpen:
          summary.criticalOpen + (!item.checked && item.severity === "critical" ? 1 : 0)
      };
    },
    {
      total: 0,
      checked: 0,
      unresolved: 0,
      overridden: 0,
      blockedOpen: 0,
      criticalOpen: 0
    }
  );
}

export function buildSessionSummary(session: Session): SessionSummary {
  const baselineMeasurement = session.measurements[0];
  const latestMeasurement = session.measurements.at(-1);

  return {
    measurementCount: session.measurements.length,
    adjustmentCount: session.adjustments.length,
    latestWarnings: latestMeasurement?.warnings ?? [],
    warningCount: session.measurements.reduce(
      (total, measurement) => total + measurement.warnings.length,
      0
    ),
    targetCrossPct: session.targetCrossPct,
    crossTolerancePct: session.crossTolerancePct,
    ...(baselineMeasurement
      ? {
          baselineCrossPct: baselineMeasurement.calculations.selectedCrossPct,
          baselineTotalKg: baselineMeasurement.calculations.totalKg,
          baselineRakeMm: baselineMeasurement.calculations.rakeMm
        }
      : {}),
    ...(latestMeasurement
      ? {
          finalCrossPct: latestMeasurement.calculations.selectedCrossPct,
          finalCrossErrorPct: latestMeasurement.calculations.crossErrorPct,
          withinCrossTolerance:
            Math.abs(latestMeasurement.calculations.crossErrorPct) <= session.crossTolerancePct,
          finalTotalKg: latestMeasurement.calculations.totalKg,
          finalRakeMm: latestMeasurement.calculations.rakeMm
        }
      : {}),
    ...(baselineMeasurement && latestMeasurement
      ? {
          crossChangePct:
            latestMeasurement.calculations.selectedCrossPct -
            baselineMeasurement.calculations.selectedCrossPct,
          totalChangeKg:
            latestMeasurement.calculations.totalKg - baselineMeasurement.calculations.totalKg,
          ...(baselineMeasurement.calculations.rakeMm != null &&
          latestMeasurement.calculations.rakeMm != null
            ? {
                rakeChangeMm:
                  latestMeasurement.calculations.rakeMm -
                  baselineMeasurement.calculations.rakeMm
              }
            : {})
        }
      : {}),
    safetyChecklist: summarizeChecklist(session.safetyChecklist),
    finalChecklist: summarizeChecklist(session.finalChecklist)
  };
}
