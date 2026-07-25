/* This file is auto-generated from public/data/assets-manifest.csv. */
export type AssetStatus = "draft" | "review" | "approved" | "deprecated";
export type VisualAssetId = "STEP-01" | "STEP-02" | "STEP-03" | "STEP-04" | "STEP-05" | "STEP-06" | "STEP-07" | "STEP-08" | "DIAGRAM-FOUR-CORNER" | "DIAGRAM-SCALE-PAD-STATES" | "DIAGRAM-COILOVER-ARCHITECTURE" | "DIAGRAM-CROSS-WEIGHT" | "SAFETY-JACK-SUPPORT" | "SAFETY-PAD-INTERFERENCE" | "SAFETY-SWAY-LINK" | "SAFETY-TIRE-CENTERING" | "SAFETY-COLLAR-LOCK" | "SAFETY-ALIGNMENT";

export interface VisualAsset {
  id: VisualAssetId;
  filename: string;
  src: string;
  alt: string;
  aspectRatio: string;
  status: AssetStatus;
  category: string;
  screen: string;
  component: string;
  figmaFrame: string;
  version: number;
}

export const visualAssets = {
  "STEP-01": {
    id: "STEP-01",
    filename: "steps/step-01-workspace-and-pad-plane.svg",
    src: "/assets/corner-balance/steps/step-01-workspace-and-pad-plane.svg",
    alt: "Workshop with four scale pads aligned in one plane and safe clearance around the scales.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "workspace",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-01",
    version: 1
  },
  "STEP-02": {
    id: "STEP-02",
    filename: "steps/step-02-ride-height-and-prechecks.svg",
    src: "/assets/corner-balance/steps/step-02-ride-height-and-prechecks.svg",
    alt: "Side view of the car with repeatable ride-height marks and pre-check tools staged nearby.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "vehicle-prep",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-02",
    version: 1
  },
  "STEP-03": {
    id: "STEP-03",
    filename: "steps/step-03-race-load-and-sway-bar.svg",
    src: "/assets/corner-balance/steps/step-03-race-load-and-sway-bar.svg",
    alt: "Top-down car with ballast and a sway-bar preparation inset showing the loaded setup condition.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "session-setup",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-03",
    version: 1
  },
  "STEP-04": {
    id: "STEP-04",
    filename: "steps/step-04-roll-on-and-center.svg",
    src: "/assets/corner-balance/steps/step-04-roll-on-and-center.svg",
    alt: "Top-down view of the car rolling onto four centered scale pads with clear approach space.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "baseline",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-04",
    version: 1
  },
  "STEP-05": {
    id: "STEP-05",
    filename: "steps/step-05-settle-and-record.svg",
    src: "/assets/corner-balance/steps/step-05-settle-and-record.svg",
    alt: "Car resting on four scales during the settling and recording process.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "baseline",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-05",
    version: 1
  },
  "STEP-06": {
    id: "STEP-06",
    filename: "steps/step-06-adjustment-and-diagonal-transfer.svg",
    src: "/assets/corner-balance/steps/step-06-adjustment-and-diagonal-transfer.svg",
    alt: "Split view of a coilover adjustment cutaway and the car on scales for diagonal transfer guidance.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "adjustment",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-06",
    version: 1
  },
  "STEP-07": {
    id: "STEP-07",
    filename: "steps/step-07-torque-and-neutralize.svg",
    src: "/assets/corner-balance/steps/step-07-torque-and-neutralize.svg",
    alt: "Vehicle supported at ride height with torque and sway-bar neutralization work highlighted.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "finalize",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-07",
    version: 1
  },
  "STEP-08": {
    id: "STEP-08",
    filename: "steps/step-08-final-verification-and-report.svg",
    src: "/assets/corner-balance/steps/step-08-final-verification-and-report.svg",
    alt: "Final verification scene with wheel torque, alignment preparation, and report export context.",
    aspectRatio: "16:9",
    status: "draft",
    category: "step",
    screen: "report",
    component: "StepIllustration",
    figmaFrame: "04_STEP_ILLUSTRATIONS/STEP-08",
    version: 1
  },
  "DIAGRAM-FOUR-CORNER": {
    id: "DIAGRAM-FOUR-CORNER",
    filename: "diagrams/diagram-four-corner-orientation.svg",
    src: "/assets/corner-balance/diagrams/diagram-four-corner-orientation.svg",
    alt: "Top-down car on four corner scales with the front of the car pointing upward and consistent LF RF LR RR orientation.",
    aspectRatio: "16:9",
    status: "draft",
    category: "diagram",
    screen: "results",
    component: "CornerDiagram",
    figmaFrame: "04_STEP_ILLUSTRATIONS/DIAGRAM-FOUR-CORNER",
    version: 1
  },
  "DIAGRAM-SCALE-PAD-STATES": {
    id: "DIAGRAM-SCALE-PAD-STATES",
    filename: "diagrams/diagram-scale-pad-states.svg",
    src: "/assets/corner-balance/diagrams/diagram-scale-pad-states.svg",
    alt: "Three scale-pad panels comparing centered support, edge loading, and pad interference.",
    aspectRatio: "16:9",
    status: "draft",
    category: "diagram",
    screen: "workspace",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/DIAGRAM-SCALE-PAD-STATES",
    version: 1
  },
  "DIAGRAM-COILOVER-ARCHITECTURE": {
    id: "DIAGRAM-COILOVER-ARCHITECTURE",
    filename: "diagrams/diagram-coilover-architecture.svg",
    src: "/assets/corner-balance/diagrams/diagram-coilover-architecture.svg",
    alt: "Comparison of spring-seat and separate lower-mount height adjustment architectures.",
    aspectRatio: "16:9",
    status: "draft",
    category: "diagram",
    screen: "adjustment",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/DIAGRAM-COILOVER-ARCHITECTURE",
    version: 1
  },
  "DIAGRAM-CROSS-WEIGHT": {
    id: "DIAGRAM-CROSS-WEIGHT",
    filename: "diagrams/diagram-cross-weight-explainer.svg",
    src: "/assets/corner-balance/diagrams/diagram-cross-weight-explainer.svg",
    alt: "Top-down car geometry for explaining both diagonals and the selected cross-weight convention.",
    aspectRatio: "16:9",
    status: "draft",
    category: "diagram",
    screen: "results",
    component: "CornerDiagram",
    figmaFrame: "04_STEP_ILLUSTRATIONS/DIAGRAM-CROSS-WEIGHT",
    version: 1
  },
  "SAFETY-JACK-SUPPORT": {
    id: "SAFETY-JACK-SUPPORT",
    filename: "safety/safety-compare-jack-support.svg",
    src: "/assets/corner-balance/safety/safety-compare-jack-support.svg",
    alt: "Safe and unsafe comparison for jack-only support versus rated stands or a lift.",
    aspectRatio: "16:9",
    status: "draft",
    category: "safety",
    screen: "finalize",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/SAFETY-JACK-SUPPORT",
    version: 1
  },
  "SAFETY-PAD-INTERFERENCE": {
    id: "SAFETY-PAD-INTERFERENCE",
    filename: "safety/safety-compare-pad-interference.svg",
    src: "/assets/corner-balance/safety/safety-compare-pad-interference.svg",
    alt: "Safe and unsafe comparison for free scale-pad travel versus ramp or chock interference.",
    aspectRatio: "16:9",
    status: "draft",
    category: "safety",
    screen: "workspace",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/SAFETY-PAD-INTERFERENCE",
    version: 1
  },
  "SAFETY-SWAY-LINK": {
    id: "SAFETY-SWAY-LINK",
    filename: "safety/safety-compare-sway-link.svg",
    src: "/assets/corner-balance/safety/safety-compare-sway-link.svg",
    alt: "Safe and unsafe comparison for forced sway-bar preload versus a neutral link position.",
    aspectRatio: "16:9",
    status: "draft",
    category: "safety",
    screen: "vehicle-prep",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/SAFETY-SWAY-LINK",
    version: 1
  },
  "SAFETY-TIRE-CENTERING": {
    id: "SAFETY-TIRE-CENTERING",
    filename: "safety/safety-compare-tire-centering.svg",
    src: "/assets/corner-balance/safety/safety-compare-tire-centering.svg",
    alt: "Safe and unsafe comparison for a centered tire versus a tire near the pad edge.",
    aspectRatio: "16:9",
    status: "draft",
    category: "safety",
    screen: "baseline",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/SAFETY-TIRE-CENTERING",
    version: 1
  },
  "SAFETY-COLLAR-LOCK": {
    id: "SAFETY-COLLAR-LOCK",
    filename: "safety/safety-compare-collar-lock.svg",
    src: "/assets/corner-balance/safety/safety-compare-collar-lock.svg",
    alt: "Safe and unsafe comparison for a locked spring perch collar versus a loose collar.",
    aspectRatio: "16:9",
    status: "draft",
    category: "safety",
    screen: "finalize",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/SAFETY-COLLAR-LOCK",
    version: 1
  },
  "SAFETY-ALIGNMENT": {
    id: "SAFETY-ALIGNMENT",
    filename: "safety/safety-compare-alignment.svg",
    src: "/assets/corner-balance/safety/safety-compare-alignment.svg",
    alt: "Safe and unsafe comparison for driving before alignment verification versus after verified setup.",
    aspectRatio: "16:9",
    status: "draft",
    category: "safety",
    screen: "finalize",
    component: "SafetyComparison",
    figmaFrame: "04_STEP_ILLUSTRATIONS/SAFETY-ALIGNMENT",
    version: 1
  }
} as const satisfies Record<VisualAssetId, VisualAsset>;

export const visualAssetList = Object.values(visualAssets);
