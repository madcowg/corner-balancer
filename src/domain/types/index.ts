import { z } from "zod";

export const corners = ["LF", "RF", "LR", "RR"] as const;
export type Corner = (typeof corners)[number];

export const cornerMarkers = {
  LF: "square",
  RF: "circle",
  LR: "triangle",
  RR: "diamond"
} as const;

export const weightUnits = ["lb", "kg"] as const;
export type WeightUnit = (typeof weightUnits)[number];

export const heightUnits = ["mm", "in"] as const;
export type HeightUnit = (typeof heightUnits)[number];

export const pressureUnits = ["psi", "kPa"] as const;
export type PressureUnit = (typeof pressureUnits)[number];

export const crossConventions = ["LF_RR", "RF_LR"] as const;
export type CrossConvention = (typeof crossConventions)[number];

export const vehicleUses = ["autocross", "road_course", "street", "other"] as const;
export type VehicleUse = (typeof vehicleUses)[number];

export const coiloverTypes = [
  "single_adjuster_spring_perch",
  "separate_height_and_preload",
  "non_coilover_adjustable",
  "unknown"
] as const;
export type CoiloverType = (typeof coiloverTypes)[number];

export const swayBarStates = ["connected", "neutralized", "disconnected", "unknown"] as const;
export type SwayBarState = (typeof swayBarStates)[number];

export const sessionStatuses = [
  "draft",
  "active",
  "complete",
  "alignment_pending",
  "archived"
] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

export const sessionFlowSteps = [
  "setup",
  "workspace",
  "vehicle-prep",
  "baseline",
  "results",
  "adjust",
  "settle",
  "finalize",
  "report"
] as const;
export type SessionFlowStep = (typeof sessionFlowSteps)[number];

export const checklistSeverities = ["info", "caution", "critical", "blocked"] as const;
export type ChecklistSeverity = (typeof checklistSeverities)[number];

export const adjustmentTypes = [
  "spring_seat",
  "lower_mount_height",
  "torsion_bar",
  "shim",
  "other"
] as const;
export type AdjustmentType = (typeof adjustmentTypes)[number];

export const adjustmentDirections = ["increase", "decrease"] as const;
export type AdjustmentDirection = (typeof adjustmentDirections)[number];

export const adjustmentAmountUnits = ["turn", "mm", "in", "custom"] as const;
export type AdjustmentAmountUnit = (typeof adjustmentAmountUnits)[number];

export type NumericInput = number | null | undefined;
export type CornerValues = Record<Corner, number>;
export type OptionalCornerValues = Partial<CornerValues>;

export interface UnitValue<TUnit extends string> {
  value: NumericInput;
  unit: TUnit;
}

export type CornerUnitValues<TUnit extends string> = Record<Corner, UnitValue<TUnit>>;

export interface CalculatedMetrics {
  totalKg: number;
  frontPct: number;
  rearPct: number;
  leftPct: number;
  rightPct: number;
  crossLfRrPct: number;
  crossRfLrPct: number;
  selectedCrossConvention: CrossConvention;
  selectedCrossPct: number;
  targetCrossPct: number;
  crossErrorPct: number;
  frontSideDeltaMm?: number;
  rearSideDeltaMm?: number;
  averageFrontHeightMm?: number;
  averageRearHeightMm?: number;
  rakeMm?: number;
}

export interface ChecklistRecord {
  id: string;
  label: string;
  severity: ChecklistSeverity;
  checked: boolean;
  overrideReason?: string;
  updatedAt: string;
}

export interface SetupSnapshot {
  version: number;
  eventType: string;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  pressureUnit: PressureUnit;
  targetCrossPct: number;
  crossTolerancePct: number;
  selectedCrossConvention: CrossConvention;
  targetRideHeightsMm?: CornerValues;
  sideHeightToleranceMm: number;
  rakeTargetMm?: number;
  driverOrBallastKg?: number;
  fuelDescription: string;
  equipmentNotes?: string;
  tirePressuresPsi?: CornerValues;
  damperSettings?: string;
  ballastDescription?: string;
  swayBarState: SwayBarState;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  nickname: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  primaryUse: VehicleUse;
  coiloverType: CoiloverType;
  preferredWeightUnit: WeightUnit;
  preferredHeightUnit: HeightUnit;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Measurement {
  id: string;
  sequence: number;
  weightsKg: CornerValues;
  rideHeightsMm?: CornerValues;
  tirePressuresPsi?: CornerValues;
  calculations: CalculatedMetrics;
  settled: boolean;
  valid: boolean;
  warnings: string[];
  notes?: string;
  createdAt: string;
}

export interface Adjustment {
  id: string;
  afterMeasurementId: string;
  corner: Corner;
  adjusterType: AdjustmentType;
  direction: AdjustmentDirection;
  amount: number;
  amountUnit: AdjustmentAmountUnit;
  reason: string;
  createdAt: string;
}

export interface Session {
  id: string;
  vehicleId: string;
  ownerId: string;
  status: SessionStatus;
  currentStep: SessionFlowStep;
  targetCrossPct: number;
  crossTolerancePct: number;
  sideHeightToleranceMm: number;
  totalDriftWarningPct: number;
  setupSnapshot: SetupSnapshot;
  baselineSetupSnapshot?: SetupSnapshot;
  safetyChecklist: ChecklistRecord[];
  measurements: Measurement[];
  adjustments: Adjustment[];
  finalChecklist: ChecklistRecord[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export const cornerValuesSchema = z.object({
  LF: z.number(),
  RF: z.number(),
  LR: z.number(),
  RR: z.number()
});

export const calculatedMetricsSchema = z.object({
  totalKg: z.number(),
  frontPct: z.number(),
  rearPct: z.number(),
  leftPct: z.number(),
  rightPct: z.number(),
  crossLfRrPct: z.number(),
  crossRfLrPct: z.number(),
  selectedCrossConvention: z.enum(crossConventions),
  selectedCrossPct: z.number(),
  targetCrossPct: z.number(),
  crossErrorPct: z.number(),
  frontSideDeltaMm: z.number().optional(),
  rearSideDeltaMm: z.number().optional(),
  averageFrontHeightMm: z.number().optional(),
  averageRearHeightMm: z.number().optional(),
  rakeMm: z.number().optional()
});

export const checklistRecordSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  severity: z.enum(checklistSeverities),
  checked: z.boolean(),
  overrideReason: z.string().min(1).optional(),
  updatedAt: z.string().min(1)
});

export const setupSnapshotSchema = z.object({
  version: z.number().int().positive(),
  eventType: z.string().min(1),
  weightUnit: z.enum(weightUnits),
  heightUnit: z.enum(heightUnits),
  pressureUnit: z.enum(pressureUnits),
  targetCrossPct: z.number(),
  crossTolerancePct: z.number().nonnegative(),
  selectedCrossConvention: z.enum(crossConventions),
  targetRideHeightsMm: cornerValuesSchema.optional(),
  sideHeightToleranceMm: z.number().nonnegative(),
  rakeTargetMm: z.number().optional(),
  driverOrBallastKg: z.number().nonnegative().optional(),
  fuelDescription: z.string().min(1),
  equipmentNotes: z.string().optional(),
  tirePressuresPsi: cornerValuesSchema.optional(),
  damperSettings: z.string().optional(),
  ballastDescription: z.string().optional(),
  swayBarState: z.enum(swayBarStates)
});

export const vehicleSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  nickname: z.string().min(1),
  year: z.number().int().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  primaryUse: z.enum(vehicleUses),
  coiloverType: z.enum(coiloverTypes),
  preferredWeightUnit: z.enum(weightUnits),
  preferredHeightUnit: z.enum(heightUnits),
  notes: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const measurementSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  weightsKg: cornerValuesSchema,
  rideHeightsMm: cornerValuesSchema.optional(),
  tirePressuresPsi: cornerValuesSchema.optional(),
  calculations: calculatedMetricsSchema,
  settled: z.boolean(),
  valid: z.boolean(),
  warnings: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.string().min(1)
});

export const adjustmentSchema = z.object({
  id: z.string().min(1),
  afterMeasurementId: z.string().min(1),
  corner: z.enum(corners),
  adjusterType: z.enum(adjustmentTypes),
  direction: z.enum(adjustmentDirections),
  amount: z.number(),
  amountUnit: z.enum(adjustmentAmountUnits),
  reason: z.string().min(1),
  createdAt: z.string().min(1)
});

export const sessionSchema = z.object({
  id: z.string().min(1),
  vehicleId: z.string().min(1),
  ownerId: z.string().min(1),
  status: z.enum(sessionStatuses),
  currentStep: z.enum(sessionFlowSteps),
  targetCrossPct: z.number(),
  crossTolerancePct: z.number().nonnegative(),
  sideHeightToleranceMm: z.number().nonnegative(),
  totalDriftWarningPct: z.number().nonnegative(),
  setupSnapshot: setupSnapshotSchema,
  baselineSetupSnapshot: setupSnapshotSchema.optional(),
  safetyChecklist: z.array(checklistRecordSchema),
  measurements: z.array(measurementSchema),
  adjustments: z.array(adjustmentSchema),
  finalChecklist: z.array(checklistRecordSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  completedAt: z.string().min(1).optional()
});

export type PersistedVehicle = z.infer<typeof vehicleSchema>;
export type PersistedSession = z.infer<typeof sessionSchema>;

export function createCornerValues(values: CornerValues): CornerValues {
  return {
    LF: values.LF,
    RF: values.RF,
    LR: values.LR,
    RR: values.RR
  };
}

export function getCrossLabel(convention: CrossConvention): "LF+RR" | "RF+LR" {
  return convention === "LF_RR" ? "LF+RR" : "RF+LR";
}
