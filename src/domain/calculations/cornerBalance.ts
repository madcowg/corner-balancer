import type { CalculatedMetrics, CornerValues, CrossConvention } from "../types";

export interface CornerBalanceCalculationInput {
  weightsKg: CornerValues;
  targetCrossPct: number;
  selectedCrossConvention: CrossConvention;
  rideHeightsMm?: CornerValues;
}

export function calculateCornerBalance({
  weightsKg,
  targetCrossPct,
  selectedCrossConvention,
  rideHeightsMm
}: CornerBalanceCalculationInput): CalculatedMetrics {
  const totalKg = weightsKg.LF + weightsKg.RF + weightsKg.LR + weightsKg.RR;

  if (totalKg <= 0) {
    throw new Error("Total weight must be greater than zero to calculate corner balance.");
  }

  const frontPct = ((weightsKg.LF + weightsKg.RF) / totalKg) * 100;
  const rearPct = ((weightsKg.LR + weightsKg.RR) / totalKg) * 100;
  const leftPct = ((weightsKg.LF + weightsKg.LR) / totalKg) * 100;
  const rightPct = ((weightsKg.RF + weightsKg.RR) / totalKg) * 100;
  const crossLfRrPct = ((weightsKg.LF + weightsKg.RR) / totalKg) * 100;
  const crossRfLrPct = ((weightsKg.RF + weightsKg.LR) / totalKg) * 100;
  const selectedCrossPct = selectedCrossConvention === "LF_RR" ? crossLfRrPct : crossRfLrPct;

  if (!rideHeightsMm) {
    return {
      totalKg,
      frontPct,
      rearPct,
      leftPct,
      rightPct,
      crossLfRrPct,
      crossRfLrPct,
      selectedCrossConvention,
      selectedCrossPct,
      targetCrossPct,
      crossErrorPct: selectedCrossPct - targetCrossPct
    };
  }

  const frontSideDeltaMm = rideHeightsMm.LF - rideHeightsMm.RF;
  const rearSideDeltaMm = rideHeightsMm.LR - rideHeightsMm.RR;
  const averageFrontHeightMm = (rideHeightsMm.LF + rideHeightsMm.RF) / 2;
  const averageRearHeightMm = (rideHeightsMm.LR + rideHeightsMm.RR) / 2;

  return {
    totalKg,
    frontPct,
    rearPct,
    leftPct,
    rightPct,
    crossLfRrPct,
    crossRfLrPct,
    selectedCrossConvention,
    selectedCrossPct,
    targetCrossPct,
    crossErrorPct: selectedCrossPct - targetCrossPct,
    frontSideDeltaMm,
    rearSideDeltaMm,
    averageFrontHeightMm,
    averageRearHeightMm,
    rakeMm: averageRearHeightMm - averageFrontHeightMm
  };
}
