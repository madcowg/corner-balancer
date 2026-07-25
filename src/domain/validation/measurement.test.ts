import { describe, expect, it } from "vitest";

import type { CornerUnitValues, HeightUnit, PressureUnit, WeightUnit } from "../types";
import { validateMeasurementInput } from "./measurement";

function createReadings<TUnit extends string>(
  values: [number | null | undefined, number | null | undefined, number | null | undefined, number | null | undefined],
  unit: TUnit
): CornerUnitValues<TUnit> {
  return {
    LF: { value: values[0], unit },
    RF: { value: values[1], unit },
    LR: { value: values[2], unit },
    RR: { value: values[3], unit }
  };
}

describe("validateMeasurementInput", () => {
  it("rejects blank, mixed-unit, and unsettled measurements", () => {
    const weights: CornerUnitValues<WeightUnit> = {
      LF: { value: null, unit: "lb" },
      RF: { value: 620, unit: "lb" },
      LR: { value: 580, unit: "kg" },
      RR: { value: 600, unit: "lb" }
    };

    const result = validateMeasurementInput({
      weights,
      settled: false,
      targetCrossPct: 50,
      selectedCrossConvention: "LF_RR"
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("LF weights is required.");
    expect(result.errors).toContain("All corner weights must use the same unit.");
    expect(result.errors).toContain(
      "Measurement cannot be marked valid until the suspension has been resettled."
    );
  });

  it("requires all four optional ride heights together", () => {
    const result = validateMeasurementInput({
      weights: createReadings<WeightUnit>([600, 610, 590, 605], "lb"),
      rideHeights: createReadings<HeightUnit>([4.3, null, 4.6, 4.5], "in"),
      settled: true,
      targetCrossPct: 50,
      selectedCrossConvention: "LF_RR"
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Ride heights must include LF, RF, LR, and RR together when provided."
    );
  });

  it("normalizes a valid measurement and raises drift/setup warnings", () => {
    const result = validateMeasurementInput(
      {
        weights: createReadings<WeightUnit>([600, 620, 580, 600], "lb"),
        rideHeights: createReadings<HeightUnit>([4.33, 4.25, 4.65, 4.6], "in"),
        tirePressures: createReadings<PressureUnit>([32, 32, 31, 31], "psi"),
        settled: true,
        targetCrossPct: 50,
        selectedCrossConvention: "LF_RR"
      },
      {
        baselineTotalKg: 1060,
        baselineTirePressuresPsi: {
          LF: 31,
          RF: 31,
          LR: 31,
          RR: 31
        },
        baselineFuelDescription: "Half tank",
        currentFuelDescription: "Quarter tank",
        baselineBallastDescription: "Driver only",
        currentBallastDescription: "Driver plus ballast bag",
        baselineDamperSettings: "8 clicks",
        currentDamperSettings: "10 clicks",
        totalDriftWarningPct: 1
      }
    );

    expect(result.valid).toBe(true);
    expect(result.normalized?.weightsKg.LF).toBeCloseTo(272.155, 3);
    expect(result.normalized?.rideHeightsMm?.LF).toBeCloseTo(109.982, 3);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Total weight drifted .* exceeding the 1.00% threshold\./)
      ])
    );
    expect(result.warnings).toContain("Tire pressure state changed from the baseline setup.");
    expect(result.warnings).toContain("Fuel state changed from the baseline setup.");
    expect(result.warnings).toContain("Ballast state changed from the baseline setup.");
    expect(result.warnings).toContain("Damper settings changed from the baseline setup.");
  });
});
