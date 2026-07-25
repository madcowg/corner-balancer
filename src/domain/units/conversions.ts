import type {
  Corner,
  CornerUnitValues,
  CornerValues,
  HeightUnit,
  PressureUnit,
  WeightUnit
} from "../types";
import { corners } from "../types";

const POUNDS_PER_KILOGRAM = 2.2046226218;
const MILLIMETERS_PER_INCH = 25.4;
const KPA_PER_PSI = 6.8947572932;

export function convertWeightToKg(value: number, unit: WeightUnit) {
  return unit === "kg" ? value : value / POUNDS_PER_KILOGRAM;
}

export function convertKgToWeight(valueKg: number, unit: WeightUnit) {
  return unit === "kg" ? valueKg : valueKg * POUNDS_PER_KILOGRAM;
}

export function convertHeightToMm(value: number, unit: HeightUnit) {
  return unit === "mm" ? value : value * MILLIMETERS_PER_INCH;
}

export function convertMmToHeight(valueMm: number, unit: HeightUnit) {
  return unit === "mm" ? valueMm : valueMm / MILLIMETERS_PER_INCH;
}

export function convertPressureToPsi(value: number, unit: PressureUnit) {
  return unit === "psi" ? value : value / KPA_PER_PSI;
}

export function convertPsiToPressure(valuePsi: number, unit: PressureUnit) {
  return unit === "psi" ? valuePsi : valuePsi * KPA_PER_PSI;
}

export function normalizeCornerWeightsToKg(readings: CornerUnitValues<WeightUnit>): CornerValues {
  return mapCornerUnitValues(readings, (corner, value, unit) => convertWeightToKg(assertDefined(value, corner), unit));
}

export function normalizeCornerHeightsToMm(readings: CornerUnitValues<HeightUnit>): CornerValues {
  return mapCornerUnitValues(readings, (corner, value, unit) => convertHeightToMm(assertDefined(value, corner), unit));
}

export function normalizeCornerPressuresToPsi(readings: CornerUnitValues<PressureUnit>): CornerValues {
  return mapCornerUnitValues(readings, (corner, value, unit) => convertPressureToPsi(assertDefined(value, corner), unit));
}

function mapCornerUnitValues<TUnit extends string>(
  readings: CornerUnitValues<TUnit>,
  mapper: (corner: Corner, value: number | null | undefined, unit: TUnit) => number
): CornerValues {
  return corners.reduce<CornerValues>(
    (result, corner) => ({
      ...result,
      [corner]: mapper(corner, readings[corner].value, readings[corner].unit)
    }),
    { LF: 0, RF: 0, LR: 0, RR: 0 }
  );
}

function assertDefined(value: number | null | undefined, corner: Corner) {
  if (typeof value !== "number") {
    throw new Error(`Expected a numeric value for ${corner}.`);
  }

  return value;
}
