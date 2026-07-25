import { describe, expect, it } from "vitest";

import {
  convertHeightToMm,
  convertKgToWeight,
  convertMmToHeight,
  convertPressureToPsi,
  convertPsiToPressure,
  convertWeightToKg
} from "./conversions";

describe("unit conversions", () => {
  it("converts between pounds and kilograms", () => {
    expect(convertWeightToKg(100, "lb")).toBeCloseTo(45.3592, 4);
    expect(convertKgToWeight(45.3592, "lb")).toBeCloseTo(100, 3);
  });

  it("converts between inches and millimeters", () => {
    expect(convertHeightToMm(10, "in")).toBeCloseTo(254, 5);
    expect(convertMmToHeight(254, "in")).toBeCloseTo(10, 5);
  });

  it("converts between kilopascals and psi", () => {
    expect(convertPressureToPsi(220, "kPa")).toBeCloseTo(31.9083, 4);
    expect(convertPsiToPressure(32, "kPa")).toBeCloseTo(220.6322, 4);
  });
});
