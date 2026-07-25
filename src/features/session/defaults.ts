import type {
  Adjustment,
  ChecklistRecord,
  Session,
  SessionFlowStep,
  SetupSnapshot,
  Vehicle
} from "../../domain/types";

const GUEST_OWNER_ID = "guest-local";

function nowIso() {
  return new Date().toISOString();
}

function createChecklistRecord(
  id: string,
  label: string,
  severity: ChecklistRecord["severity"]
): ChecklistRecord {
  return {
    id,
    label,
    severity,
    checked: false,
    updatedAt: nowIso()
  };
}

export function createWorkspaceChecklist() {
  return [
    createChecklistRecord("clear-area", "Clear work area around scales and ramps", "critical"),
    createChecklistRecord("four-pads", "All four pads are present and assigned", "critical"),
    createChecklistRecord("same-plane", "All four pads are shimmed into the same plane", "blocked"),
    createChecklistRecord("stable-shims", "Shims and supports are stable and rated", "blocked"),
    createChecklistRecord("ramps-clear", "Ramps and chocks cannot touch floating pad surfaces", "blocked"),
    createChecklistRecord("battery-check", "Scale batteries or power state were checked", "caution"),
    createChecklistRecord("zero-check", "Zero was confirmed before loading", "critical"),
    createChecklistRecord("movement-plan", "Loading plan is understood before rolling", "critical"),
    createChecklistRecord("hands-feet-clear", "Hands and feet stay clear during movement", "blocked")
  ];
}

export function createFinalChecklist() {
  return [
    createChecklistRecord("ride-height-recorded", "Ride heights were recorded at the final state", "critical"),
    createChecklistRecord("identified-pivots-torqued", "Only identified pivots were torqued to verified specs", "blocked"),
    createChecklistRecord("collars-locked", "Spring seats and lock collars were secured", "critical"),
    createChecklistRecord("sway-links-neutral", "Sway-bar links were reconnected without preload", "critical"),
    createChecklistRecord("wheels-installed", "Wheels and hardware were reinstalled correctly", "critical"),
    createChecklistRecord("wheel-torque", "Wheel torque was verified before driving", "blocked"),
    createChecklistRecord("test-drive", "A cautious test drive was completed", "caution"),
    createChecklistRecord("alignment", "Alignment was completed or explicitly scheduled", "critical")
  ];
}

export function createDefaultSetupSnapshot(vehicle: Vehicle): SetupSnapshot {
  return {
    version: 1,
    eventType: vehicle.primaryUse,
    weightUnit: vehicle.preferredWeightUnit,
    heightUnit: vehicle.preferredHeightUnit,
    pressureUnit: "psi",
    targetCrossPct: 50,
    crossTolerancePct: 0.25,
    selectedCrossConvention: "RF_LR",
    sideHeightToleranceMm: 3,
    fuelDescription: "Not recorded",
    ballastDescription: "Driver only",
    swayBarState: "unknown"
  };
}

export function createNewSession(vehicle: Vehicle): Session {
  const timestamp = nowIso();
  const setupSnapshot = createDefaultSetupSnapshot(vehicle);

  return {
    id: crypto.randomUUID(),
    vehicleId: vehicle.id,
    ownerId: vehicle.ownerId || GUEST_OWNER_ID,
    status: "draft",
    currentStep: "setup",
    targetCrossPct: setupSnapshot.targetCrossPct,
    crossTolerancePct: setupSnapshot.crossTolerancePct,
    sideHeightToleranceMm: setupSnapshot.sideHeightToleranceMm,
    totalDriftWarningPct: 1,
    setupSnapshot,
    safetyChecklist: createWorkspaceChecklist(),
    measurements: [],
    adjustments: [],
    finalChecklist: createFinalChecklist(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createSessionFromTemplate(sourceSession: Session, vehicle: Vehicle): Session {
  const timestamp = nowIso();

  return {
    id: crypto.randomUUID(),
    vehicleId: vehicle.id,
    ownerId: vehicle.ownerId || GUEST_OWNER_ID,
    status: "draft",
    currentStep: "setup",
    targetCrossPct: sourceSession.setupSnapshot.targetCrossPct,
    crossTolerancePct: sourceSession.setupSnapshot.crossTolerancePct,
    sideHeightToleranceMm: sourceSession.setupSnapshot.sideHeightToleranceMm,
    totalDriftWarningPct: sourceSession.totalDriftWarningPct,
    setupSnapshot: {
      ...sourceSession.setupSnapshot,
      ...(sourceSession.setupSnapshot.targetRideHeightsMm
        ? {
            targetRideHeightsMm: {
              ...sourceSession.setupSnapshot.targetRideHeightsMm
            }
          }
        : {}),
      ...(sourceSession.setupSnapshot.tirePressuresPsi
        ? {
            tirePressuresPsi: {
              ...sourceSession.setupSnapshot.tirePressuresPsi
            }
          }
        : {})
    },
    safetyChecklist: createWorkspaceChecklist(),
    measurements: [],
    adjustments: [],
    finalChecklist: createFinalChecklist(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function nextStepLabel(step: SessionFlowStep) {
  return step;
}

export function cloneAdjustment(adjustment: Adjustment): Adjustment {
  return { ...adjustment };
}

export function createGuestOwnerId() {
  return GUEST_OWNER_ID;
}
