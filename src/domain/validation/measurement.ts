import { calculateCornerBalance } from "../calculations/cornerBalance";
import type {
  CalculatedMetrics,
  Corner,
  CornerUnitValues,
  CornerValues,
  CrossConvention,
  HeightUnit,
  PressureUnit,
  WeightUnit
} from "../types";
import { corners } from "../types";
import {
  normalizeCornerHeightsToMm,
  normalizeCornerPressuresToPsi,
  normalizeCornerWeightsToKg
} from "../units/conversions";

export interface MeasurementInput {
  weights: CornerUnitValues<WeightUnit>;
  rideHeights?: CornerUnitValues<HeightUnit>;
  tirePressures?: CornerUnitValues<PressureUnit>;
  settled: boolean;
  targetCrossPct: number;
  selectedCrossConvention: CrossConvention;
}

export interface MeasurementWarningContext {
  baselineTotalKg?: number;
  baselineTirePressuresPsi?: CornerValues;
  baselineFuelDescription?: string;
  currentFuelDescription?: string;
  baselineBallastDescription?: string;
  currentBallastDescription?: string;
  baselineDamperSettings?: string;
  currentDamperSettings?: string;
  totalDriftWarningPct?: number;
}

export interface MeasurementValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized?: {
    weightsKg: CornerValues;
    rideHeightsMm?: CornerValues;
    tirePressuresPsi?: CornerValues;
  };
  calculations?: CalculatedMetrics;
}

export function validateMeasurementInput(
  input: MeasurementInput,
  warningContext: MeasurementWarningContext = {}
): MeasurementValidationResult {
  const errors: string[] = [];

  validateRequiredCornerReadings(input.weights, "weights", errors);

  if (hasMixedUnits(input.weights)) {
    errors.push("All corner weights must use the same unit.");
  }

  const rideHeightPresence = getOptionalReadingPresence(input.rideHeights);
  if (rideHeightPresence === "partial") {
    errors.push("Ride heights must include LF, RF, LR, and RR together when provided.");
  }
  if (rideHeightPresence === "full" && input.rideHeights) {
    validateRequiredCornerReadings(input.rideHeights, "ride heights", errors);
    if (hasMixedUnits(input.rideHeights)) {
      errors.push("All ride heights must use the same unit.");
    }
  }

  const pressurePresence = getOptionalReadingPresence(input.tirePressures);
  if (pressurePresence === "partial") {
    errors.push("Tire pressures must include LF, RF, LR, and RR together when provided.");
  }
  if (pressurePresence === "full" && input.tirePressures) {
    validateRequiredCornerReadings(input.tirePressures, "tire pressures", errors);
    if (hasMixedUnits(input.tirePressures)) {
      errors.push("All tire pressures must use the same unit.");
    }
  }

  if (!input.settled) {
    errors.push("Measurement cannot be marked valid until the suspension has been resettled.");
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings: [] };
  }

  const weightsKg = normalizeCornerWeightsToKg(input.weights);
  const rideHeightsMm =
    rideHeightPresence === "full" && input.rideHeights
      ? normalizeCornerHeightsToMm(input.rideHeights)
      : undefined;
  const tirePressuresPsi =
    pressurePresence === "full" && input.tirePressures
      ? normalizeCornerPressuresToPsi(input.tirePressures)
      : undefined;

  const calculations = calculateCornerBalance({
    weightsKg,
    targetCrossPct: input.targetCrossPct,
    selectedCrossConvention: input.selectedCrossConvention,
    ...(rideHeightsMm ? { rideHeightsMm } : {})
  });

  return {
    valid: true,
    errors: [],
    warnings: buildMeasurementWarnings(
      calculations,
      tirePressuresPsi,
      warningContext
    ),
    normalized: {
      weightsKg,
      ...(rideHeightsMm ? { rideHeightsMm } : {}),
      ...(tirePressuresPsi ? { tirePressuresPsi } : {})
    },
    calculations
  };
}

function validateRequiredCornerReadings<TUnit extends string>(
  readings: CornerUnitValues<TUnit>,
  label: string,
  errors: string[]
) {
  corners.forEach((corner) => {
    const reading = readings[corner];
    const value = reading.value;

    if (value == null) {
      errors.push(`${corner} ${label} is required.`);
      return;
    }

    if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
      errors.push(`${corner} ${label} must be numeric.`);
      return;
    }

    if (value <= 0) {
      errors.push(`${corner} ${label} must be greater than zero.`);
    }
  });
}

function hasMixedUnits<TUnit extends string>(readings: CornerUnitValues<TUnit>) {
  const units = corners.map((corner) => readings[corner].unit);
  return units.some((unit) => unit !== units[0]);
}

function getOptionalReadingPresence<TUnit extends string>(readings?: CornerUnitValues<TUnit>) {
  if (!readings) {
    return "none" as const;
  }

  const values = corners.map((corner) => readings[corner].value);
  const hasAny = values.some((value) => value != null);
  const hasAll = values.every((value) => value != null);

  if (!hasAny) {
    return "none" as const;
  }

  return hasAll ? ("full" as const) : ("partial" as const);
}

function buildMeasurementWarnings(
  calculations: CalculatedMetrics,
  tirePressuresPsi: CornerValues | undefined,
  warningContext: MeasurementWarningContext
) {
  const warnings: string[] = [];
  const driftThreshold = warningContext.totalDriftWarningPct ?? 1.0;

  if (warningContext.baselineTotalKg && warningContext.baselineTotalKg > 0) {
    const driftPct =
      (Math.abs(calculations.totalKg - warningContext.baselineTotalKg) /
        warningContext.baselineTotalKg) *
      100;

    if (driftPct > driftThreshold) {
      warnings.push(
        `Total weight drifted ${driftPct.toFixed(2)}% from the baseline, exceeding the ${driftThreshold.toFixed(2)}% threshold.`
      );
    }
  }

  if (
    tirePressuresPsi &&
    warningContext.baselineTirePressuresPsi &&
    corners.some(
      (corner) =>
        Math.abs(tirePressuresPsi[corner] - warningContext.baselineTirePressuresPsi![corner]) >
        0.01
    )
  ) {
    warnings.push("Tire pressure state changed from the baseline setup.");
  }

  if (normalizedString(warningContext.baselineFuelDescription) !== normalizedString(warningContext.currentFuelDescription)) {
    warnings.push("Fuel state changed from the baseline setup.");
  }

  if (
    normalizedString(warningContext.baselineBallastDescription) !==
    normalizedString(warningContext.currentBallastDescription)
  ) {
    warnings.push("Ballast state changed from the baseline setup.");
  }

  if (
    normalizedString(warningContext.baselineDamperSettings) !==
    normalizedString(warningContext.currentDamperSettings)
  ) {
    warnings.push("Damper settings changed from the baseline setup.");
  }

  return warnings;
}

function normalizedString(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export function createUniformCornerReadings<TUnit extends string>(
  value: number,
  unit: TUnit
): Record<Corner, { value: number; unit: TUnit }> {
  return corners.reduce(
    (result, corner) => ({
      ...result,
      [corner]: { value, unit }
    }),
    {} as Record<Corner, { value: number; unit: TUnit }>
  );
}
