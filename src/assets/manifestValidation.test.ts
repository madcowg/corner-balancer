import { describe, expect, it } from "vitest";

import { trainingAssets, visualAssetList } from "./registry";
import { validateVisualAssetRegistry } from "./manifestValidation";

describe("asset manifest validation", () => {
  it("keeps the development registry valid while draft placeholders are present", () => {
    expect(validateVisualAssetRegistry(visualAssetList)).toEqual([]);
    expect(trainingAssets.workspaceSetup.filename).toBe("steps/step-01-workspace-and-pad-plane.svg");
  });

  it("fails release mode when any required asset is still a draft placeholder", () => {
    const issues = validateVisualAssetRegistry(visualAssetList, "release");

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: "STEP-01",
          message: expect.stringMatching(/release builds require approved assets/i)
        })
      ])
    );
  });

  it("catches missing alt text and duplicate filenames in synthetic data", () => {
    const firstAsset = visualAssetList[0]!;
    const issues = validateVisualAssetRegistry([
      firstAsset,
      { ...firstAsset, id: "STEP-02", alt: "" }
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ assetId: "STEP-02", message: "Asset alt text is required." }),
        expect.objectContaining({ assetId: "STEP-02", message: "Duplicate asset filename detected." })
      ])
    );
  });
});
