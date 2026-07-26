import type { VisualAsset } from "./manifest.generated";

export interface AssetValidationIssue {
  assetId: string;
  message: string;
}

export function validateVisualAssetRegistry(
  assets: readonly VisualAsset[],
  mode: "development" | "release" = "development"
) {
  const issues: AssetValidationIssue[] = [];
  const filenames = new Set<string>();
  const ids = new Set<string>();

  assets.forEach((asset) => {
    if (ids.has(asset.id)) {
      issues.push({ assetId: asset.id, message: "Duplicate asset ID detected." });
    }
    ids.add(asset.id);

    if (filenames.has(asset.filename)) {
      issues.push({ assetId: asset.id, message: "Duplicate asset filename detected." });
    }
    filenames.add(asset.filename);

    if (!asset.alt.trim()) {
      issues.push({ assetId: asset.id, message: "Asset alt text is required." });
    }

    if (!Number.isInteger(asset.masterWidthPx) || asset.masterWidthPx <= 0) {
      issues.push({ assetId: asset.id, message: "Asset masterWidthPx must be a positive integer." });
    }

    if (!Number.isInteger(asset.masterHeightPx) || asset.masterHeightPx <= 0) {
      issues.push({ assetId: asset.id, message: "Asset masterHeightPx must be a positive integer." });
    }

    const [aspectWidth = 0, aspectHeight = 0] = asset.aspectRatio.split(":").map(Number);
    if (
      Number.isFinite(aspectWidth) &&
      Number.isFinite(aspectHeight) &&
      aspectWidth * asset.masterHeightPx !== aspectHeight * asset.masterWidthPx
    ) {
      issues.push({
        assetId: asset.id,
        message: "Asset master dimensions must match the declared aspect ratio."
      });
    }

    if (asset.status === "deprecated") {
      issues.push({ assetId: asset.id, message: "Deprecated assets cannot remain in the active registry." });
    }

    if (mode === "release" && asset.status !== "approved") {
      issues.push({
        assetId: asset.id,
        message: "Release builds require approved assets instead of draft or review placeholders."
      });
    }
  });

  return issues;
}
