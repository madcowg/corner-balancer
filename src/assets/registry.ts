import {
  visualAssets,
  visualAssetList,
  type AssetStatus,
  type VisualAsset,
  type VisualAssetId
} from "./manifest.generated";

export { visualAssets, visualAssetList, type AssetStatus, type VisualAsset, type VisualAssetId };

export const trainingAssets = {
  workspaceSetup: visualAssets["STEP-01"],
  prechecks: visualAssets["STEP-02"],
  vehicleLoading: visualAssets["STEP-03"],
  scalePlacement: visualAssets["STEP-04"],
  suspensionSettling: visualAssets["STEP-05"],
  crossWeightAdjustment: visualAssets["STEP-06"],
  swayBarSetup: visualAssets["STEP-07"],
  finalVerification: visualAssets["STEP-08"]
} as const;

export const supportingAssets = {
  fourCornerOrientation: visualAssets["DIAGRAM-FOUR-CORNER"],
  scalePadStates: visualAssets["DIAGRAM-SCALE-PAD-STATES"],
  coiloverArchitecture: visualAssets["DIAGRAM-COILOVER-ARCHITECTURE"],
  crossWeightExplainer: visualAssets["DIAGRAM-CROSS-WEIGHT"],
  jackSupport: visualAssets["SAFETY-JACK-SUPPORT"],
  padInterference: visualAssets["SAFETY-PAD-INTERFERENCE"],
  swayLink: visualAssets["SAFETY-SWAY-LINK"],
  tireCentering: visualAssets["SAFETY-TIRE-CENTERING"],
  collarLock: visualAssets["SAFETY-COLLAR-LOCK"],
  alignment: visualAssets["SAFETY-ALIGNMENT"]
} as const;

export function getVisualAsset(assetId: VisualAssetId): VisualAsset {
  return visualAssets[assetId];
}

export function isApprovedAsset(asset: VisualAsset) {
  return asset.status === "approved";
}
