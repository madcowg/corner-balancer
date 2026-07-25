import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { supportingAssets, trainingAssets } from "../../assets/registry";
import { useCornerBalanceApp } from "../../app/context";
import { CornerDiagram } from "../../components/illustrations/CornerDiagram";
import { SafetyComparison } from "../../components/illustrations/SafetyComparison";
import { StepIllustration } from "../../components/illustrations/StepIllustration";
import { InputField, SelectField, TextAreaField } from "../../components/forms/FormField";
import { Button } from "../../components/ui/Button";
import { MetricCard } from "../../components/ui/MetricCard";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { buildSessionStepPath } from "../../components/ui/buildSessionStepPath";
import { CriticalWarning } from "../../components/warnings/CriticalWarning";
import { ChecklistGroup } from "../../components/warnings/ChecklistGroup";
import { checklistIsResolved } from "../../components/warnings/checklistIsResolved";
import { getCrossWeightGuidance } from "../../domain/guidance/crossWeightGuidance";
import {
  buildSessionCsv,
  buildSessionJson,
  buildSessionPdf,
  downloadBinaryFile,
  downloadTextFile
} from "../reports/exporters";
import type {
  AdjustmentAmountUnit,
  AdjustmentDirection,
  AdjustmentType,
  ChecklistRecord,
  Corner,
  Session,
  SessionFlowStep
} from "../../domain/types";

const cornerLabels: Corner[] = ["LF", "RF", "LR", "RR"];

function formatMetric(value?: number) {
  return value == null ? "--" : value.toFixed(2);
}

function SessionNotFound() {
  return (
    <SurfaceCard title="Session not found" eyebrow="Session">
      <p className="mt-2 text-body text-muted">
        The requested session could not be found in local storage. Start again from the garage.
      </p>
    </SurfaceCard>
  );
}

function useSessionScreen(expectedStep: SessionFlowStep) {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const app = useCornerBalanceApp();
  const session = app.getSession(sessionId);
  const vehicle = session ? app.getVehicle(session.vehicleId) : undefined;

  useEffect(() => {
    if (session && session.currentStep !== expectedStep) {
      app.setSessionStep(session.id, expectedStep);
    }
  }, [app, expectedStep, session]);

  return { app, navigate, sessionId, session, vehicle };
}

function updateChecklist(
  app: ReturnType<typeof useCornerBalanceApp>,
  session: Session,
  listName: "safetyChecklist" | "finalChecklist",
  item: ChecklistRecord,
  checked: boolean
) {
  app.updateChecklistItem(session.id, listName, item.id, {
    checked,
    ...(checked ? { overrideReason: "" } : {})
  });
}

function renderCornerInputs(
  values: Record<Corner, string>,
  labelPrefix: string,
  onChange: (corner: Corner, value: string) => void
) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cornerLabels.map((corner) => (
        <InputField
          key={`${labelPrefix}-${corner}`}
          label={`${corner} ${labelPrefix}`}
          inputMode="decimal"
          type="number"
          value={values[corner]}
          onChange={(event) => onChange(corner, event.target.value)}
        />
      ))}
    </div>
  );
}

export function SessionSetupScreen() {
  const { app, navigate, session } = useSessionScreen("setup");

  if (!session) {
    return <SessionNotFound />;
  }

  const activeSession = session;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <SurfaceCard title="Loaded condition and targets" eyebrow="Setup">
        <p className="mt-2 text-body text-muted">
          Define the exact working state before the first baseline measurement. These values become the reference for later warnings and reports.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InputField
            label="Event type"
            value={activeSession.setupSnapshot.eventType}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, { eventType: event.target.value })
            }
          />
          <SelectField
            label="Cross convention"
            value={activeSession.setupSnapshot.selectedCrossConvention}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, {
                selectedCrossConvention: event.target.value as "LF_RR" | "RF_LR"
              })
            }
          >
            <option value="RF_LR">RF + LR</option>
            <option value="LF_RR">LF + RR</option>
          </SelectField>
          <InputField
            label="Target cross %"
            inputMode="decimal"
            type="number"
            value={String(activeSession.setupSnapshot.targetCrossPct)}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, { targetCrossPct: Number(event.target.value) })
            }
          />
          <InputField
            label="Cross tolerance %"
            inputMode="decimal"
            type="number"
            value={String(activeSession.setupSnapshot.crossTolerancePct)}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, {
                crossTolerancePct: Number(event.target.value)
              })
            }
          />
          <InputField
            label="Side-height tolerance mm"
            inputMode="decimal"
            type="number"
            value={String(activeSession.setupSnapshot.sideHeightToleranceMm)}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, {
                sideHeightToleranceMm: Number(event.target.value)
              })
            }
          />
          <InputField
            label="Driver or ballast kg"
            inputMode="decimal"
            type="number"
            value={activeSession.setupSnapshot.driverOrBallastKg?.toString() ?? ""}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, event.target.value
                ? { driverOrBallastKg: Number(event.target.value) }
                : {})
            }
          />
          <InputField
            label="Fuel description"
            value={activeSession.setupSnapshot.fuelDescription}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, { fuelDescription: event.target.value })
            }
          />
          <InputField
            label="Ballast description"
            value={activeSession.setupSnapshot.ballastDescription ?? ""}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, { ballastDescription: event.target.value })
            }
          />
          <SelectField
            label="Weight unit"
            value={activeSession.setupSnapshot.weightUnit}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, {
                weightUnit: event.target.value as "lb" | "kg"
              })
            }
          >
            <option value="lb">Pounds</option>
            <option value="kg">Kilograms</option>
          </SelectField>
          <SelectField
            label="Height unit"
            value={activeSession.setupSnapshot.heightUnit}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, {
                heightUnit: event.target.value as "in" | "mm"
              })
            }
          >
            <option value="in">Inches</option>
            <option value="mm">Millimeters</option>
          </SelectField>
          <TextAreaField
            label="Damper settings"
            value={activeSession.setupSnapshot.damperSettings ?? ""}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, { damperSettings: event.target.value })
            }
          />
          <TextAreaField
            label="Equipment notes"
            value={activeSession.setupSnapshot.equipmentNotes ?? ""}
            onChange={(event) =>
              app.updateSessionSetup(activeSession.id, { equipmentNotes: event.target.value })
            }
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate("/garage")}>
            Back to garage
          </Button>
          <Button onClick={() => navigate(buildSessionStepPath(activeSession.id, "workspace"))}>
            Continue to workspace
          </Button>
        </div>
      </SurfaceCard>
      <StepIllustration assetId={trainingAssets.vehicleLoading.id} />
    </div>
  );
}

export function WorkspaceScreen() {
  const { app, navigate, session } = useSessionScreen("workspace");

  if (!session) {
    return <SessionNotFound />;
  }

  const resolved = checklistIsResolved(session.safetyChecklist);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <CriticalWarning title="Safety gate">
          Never work under a vehicle supported only by a jack. Ramps, shims, stands, scale pads,
          and rolling paths must all be stable before you continue.
        </CriticalWarning>
        <ChecklistGroup
          title="Workspace and safety checklist"
          checklist={session.safetyChecklist}
          onToggle={(item, checked) => updateChecklist(app, session, "safetyChecklist", item, checked)}
          onOverrideReasonChange={(item, reason) =>
            app.updateChecklistItem(session.id, "safetyChecklist", item.id, {
              overrideReason: reason
            })
          }
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(session.id, "setup"))}>
            Back to setup
          </Button>
          <Button
            onClick={() => navigate(buildSessionStepPath(session.id, "vehicle-prep"))}
            disabled={!resolved}
          >
            Continue to vehicle prep
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <StepIllustration assetId={trainingAssets.workspaceSetup.id} />
        <SafetyComparison
          assetId={supportingAssets.padInterference.id}
          summary="Ramps, chocks, trays, or cables must not bind the moving part of a scale pad."
        />
      </div>
    </div>
  );
}

export function VehiclePrepScreen() {
  const { app, navigate, session } = useSessionScreen("vehicle-prep");
  const [targetHeights, setTargetHeights] = useState<Record<Corner, string>>({
    LF: session?.setupSnapshot.targetRideHeightsMm?.LF?.toString() ?? "",
    RF: session?.setupSnapshot.targetRideHeightsMm?.RF?.toString() ?? "",
    LR: session?.setupSnapshot.targetRideHeightsMm?.LR?.toString() ?? "",
    RR: session?.setupSnapshot.targetRideHeightsMm?.RR?.toString() ?? ""
  });

  if (!session) {
    return <SessionNotFound />;
  }

  const activeSession = session;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <CriticalWarning title="Mechanical caution" tone="danger">
          Do not loosen every suspension fastener. Follow the vehicle service procedure and only loosen or torque identified joints with verified specifications.
        </CriticalWarning>
        <SurfaceCard title="Preparation snapshot" eyebrow="Vehicle prep">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Fuel description"
              value={activeSession.setupSnapshot.fuelDescription}
              onChange={(event) =>
                app.updateSessionSetup(activeSession.id, { fuelDescription: event.target.value })
              }
            />
            <InputField
              label="Ballast description"
              value={activeSession.setupSnapshot.ballastDescription ?? ""}
              onChange={(event) =>
                app.updateSessionSetup(activeSession.id, { ballastDescription: event.target.value })
              }
            />
            <SelectField
              label="Sway-bar state"
              value={activeSession.setupSnapshot.swayBarState}
              onChange={(event) =>
                app.updateSessionSetup(activeSession.id, {
                  swayBarState: event.target.value as Session["setupSnapshot"]["swayBarState"]
                })
              }
            >
              <option value="unknown">Unknown</option>
              <option value="connected">Connected</option>
              <option value="neutralized">Neutralized</option>
              <option value="disconnected">Disconnected</option>
            </SelectField>
            <TextAreaField
              label="Damper settings"
              value={activeSession.setupSnapshot.damperSettings ?? ""}
              onChange={(event) =>
                app.updateSessionSetup(activeSession.id, { damperSettings: event.target.value })
              }
            />
          </div>
          <div className="mt-4 space-y-3">
            <h3 className="text-h3 font-semibold text-ink">Target ride heights</h3>
            {renderCornerInputs(targetHeights, `target (${activeSession.setupSnapshot.heightUnit})`, (corner, value) =>
              setTargetHeights((current) => ({ ...current, [corner]: value }))
            )}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() =>
                  app.updateSessionSetup(
                    activeSession.id,
                    cornerLabels.every((corner) => targetHeights[corner])
                      ? {
                          targetRideHeightsMm: {
                            LF: Number(targetHeights.LF),
                            RF: Number(targetHeights.RF),
                            LR: Number(targetHeights.LR),
                            RR: Number(targetHeights.RR)
                          }
                        }
                      : {}
                  )
                }
              >
                Save target heights
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(activeSession.id, "workspace"))}>
              Back to workspace
            </Button>
            <Button onClick={() => navigate(buildSessionStepPath(activeSession.id, "baseline"))}>
              Continue to baseline
            </Button>
          </div>
        </SurfaceCard>
      </div>
      <div className="space-y-4">
        <StepIllustration assetId={trainingAssets.prechecks.id} />
        <StepIllustration assetId={trainingAssets.vehicleLoading.id} />
        <SafetyComparison
          assetId={supportingAssets.swayLink.id}
          summary="Keep sway-bar preload changes explicit and documented. The app records the state but does not treat the image as the warning itself."
        />
      </div>
    </div>
  );
}

export function BaselineScreen() {
  const { navigate, session, app } = useSessionScreen("baseline");
  const [weights, setWeights] = useState<Record<Corner, string>>({ LF: "", RF: "", LR: "", RR: "" });
  const [rideHeights, setRideHeights] = useState<Record<Corner, string>>({
    LF: "",
    RF: "",
    LR: "",
    RR: ""
  });
  const [tirePressures, setTirePressures] = useState<Record<Corner, string>>({
    LF: session?.setupSnapshot.tirePressuresPsi?.LF?.toString() ?? "",
    RF: session?.setupSnapshot.tirePressuresPsi?.RF?.toString() ?? "",
    LR: session?.setupSnapshot.tirePressuresPsi?.LR?.toString() ?? "",
    RR: session?.setupSnapshot.tirePressuresPsi?.RR?.toString() ?? ""
  });
  const [settled, setSettled] = useState(false);
  const [result, setResult] = useState<{ errors: string[]; warnings: string[] }>({
    errors: [],
    warnings: []
  });

  if (!session) {
    return <SessionNotFound />;
  }

  const activeSession = session;

  const latestMeasurement = activeSession.measurements.at(-1);

  function handleSaveMeasurement() {
    const measurementInput = {
      weights: {
        LF: { value: Number(weights.LF), unit: activeSession.setupSnapshot.weightUnit },
        RF: { value: Number(weights.RF), unit: activeSession.setupSnapshot.weightUnit },
        LR: { value: Number(weights.LR), unit: activeSession.setupSnapshot.weightUnit },
        RR: { value: Number(weights.RR), unit: activeSession.setupSnapshot.weightUnit }
      },
      settled,
      targetCrossPct: activeSession.targetCrossPct,
      selectedCrossConvention: activeSession.setupSnapshot.selectedCrossConvention,
      ...(cornerLabels.some((corner) => rideHeights[corner])
        ? {
            rideHeights: {
              LF: { value: rideHeights.LF ? Number(rideHeights.LF) : null, unit: activeSession.setupSnapshot.heightUnit },
              RF: { value: rideHeights.RF ? Number(rideHeights.RF) : null, unit: activeSession.setupSnapshot.heightUnit },
              LR: { value: rideHeights.LR ? Number(rideHeights.LR) : null, unit: activeSession.setupSnapshot.heightUnit },
              RR: { value: rideHeights.RR ? Number(rideHeights.RR) : null, unit: activeSession.setupSnapshot.heightUnit }
            }
          }
        : {}),
      ...(cornerLabels.some((corner) => tirePressures[corner])
        ? {
            tirePressures: {
              LF: { value: tirePressures.LF ? Number(tirePressures.LF) : null, unit: "psi" as const },
              RF: { value: tirePressures.RF ? Number(tirePressures.RF) : null, unit: "psi" as const },
              LR: { value: tirePressures.LR ? Number(tirePressures.LR) : null, unit: "psi" as const },
              RR: { value: tirePressures.RR ? Number(tirePressures.RR) : null, unit: "psi" as const }
            }
          }
        : {})
    };

    const validation = app.recordMeasurement(activeSession.id, measurementInput);

    setResult({ errors: validation.errors, warnings: validation.warnings });
    if (validation.valid) {
      navigate(buildSessionStepPath(activeSession.id, "results"));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <SurfaceCard title="Record baseline or remeasure" eyebrow="Measurement">
          {latestMeasurement ? (
            <div className="mt-2 rounded-2xl bg-primary-tint p-3 text-small text-ink">
              Previous iteration cross: {latestMeasurement.calculations.selectedCrossPct.toFixed(2)}%
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            <h3 className="text-h3 font-semibold text-ink">
              Weights ({activeSession.setupSnapshot.weightUnit})
            </h3>
            {renderCornerInputs(weights, "weight", (corner, value) =>
              setWeights((current) => ({ ...current, [corner]: value }))
            )}
          </div>
          <div className="mt-4 space-y-3">
            <h3 className="text-h3 font-semibold text-ink">
              Ride heights ({activeSession.setupSnapshot.heightUnit})
            </h3>
            {renderCornerInputs(rideHeights, "ride height", (corner, value) =>
              setRideHeights((current) => ({ ...current, [corner]: value }))
            )}
          </div>
          <div className="mt-4 space-y-3">
            <h3 className="text-h3 font-semibold text-ink">Tire pressures (psi)</h3>
            {renderCornerInputs(tirePressures, "pressure", (corner, value) =>
              setTirePressures((current) => ({ ...current, [corner]: value }))
            )}
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-canvas p-3">
            <input
              type="checkbox"
              checked={settled}
              onChange={(event) => setSettled(event.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span className="text-small text-ink">
              Suspension was resettled and readings were allowed to stabilize before recording.
            </span>
          </label>
          {result.errors.length > 0 ? (
            <CriticalWarning title="Measurement blocked" tone="danger">
              {result.errors.join(" ")}
            </CriticalWarning>
          ) : null}
          {result.warnings.length > 0 ? (
            <CriticalWarning title="Measurement warnings">
              {result.warnings.join(" ")}
            </CriticalWarning>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(activeSession.id, "vehicle-prep"))}>
              Back to prep
            </Button>
            <Button onClick={handleSaveMeasurement}>Save measurement</Button>
          </div>
        </SurfaceCard>
      </div>
      <div className="space-y-4">
        <StepIllustration assetId={trainingAssets.scalePlacement.id} />
        <StepIllustration assetId={trainingAssets.suspensionSettling.id} />
        <SafetyComparison
          assetId={supportingAssets.tireCentering.id}
          summary="Tires must be centered on the pads with no edge loading or pad binding."
        />
      </div>
    </div>
  );
}

export function ResultsScreen() {
  const { navigate, session } = useSessionScreen("results");

  if (!session) {
    return <SessionNotFound />;
  }

  const measurement = session.measurements.at(-1);
  if (!measurement) {
    return <SessionNotFound />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Selected cross %" value={formatMetric(measurement.calculations.selectedCrossPct)} />
        <MetricCard label="Target error %" value={formatMetric(measurement.calculations.crossErrorPct)} />
        <MetricCard label="Total kg" value={formatMetric(measurement.calculations.totalKg)} />
        <MetricCard label="Rake mm" value={formatMetric(measurement.calculations.rakeMm)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SurfaceCard title="Current balance" eyebrow="Results">
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge tone="info">{session.setupSnapshot.selectedCrossConvention}</StatusBadge>
            <StatusBadge tone="neutral">{`Iteration ${measurement.sequence + 1}`}</StatusBadge>
          </div>
          <p className="mt-4 text-body text-muted">
            Front {measurement.calculations.frontPct.toFixed(2)}%, rear {measurement.calculations.rearPct.toFixed(2)}%, left {measurement.calculations.leftPct.toFixed(2)}%, right {measurement.calculations.rightPct.toFixed(2)}%.
          </p>
          {measurement.warnings.length > 0 ? (
            <div className="mt-4 space-y-2">
              {measurement.warnings.map((warning) => (
                <CriticalWarning key={warning} title="Warning">
                  {warning}
                </CriticalWarning>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(session.id, "baseline"))}>
              Remeasure
            </Button>
            <Button onClick={() => navigate(buildSessionStepPath(session.id, "adjust"))}>
              Log an adjustment
            </Button>
            <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(session.id, "finalize"))}>
              Skip to finalization
            </Button>
          </div>
        </SurfaceCard>
        <div className="space-y-4">
          <CornerDiagram
            assetId={supportingAssets.fourCornerOrientation.id}
            summary="Corner values, warnings, and diagonal highlights will remain live HTML around this geometry."
          />
          <CornerDiagram
            assetId={supportingAssets.crossWeightExplainer.id}
            summary="The chosen cross convention stays explicit on every result, comparison, and report view."
          />
        </div>
      </div>
    </div>
  );
}

export function AdjustmentScreen() {
  const { navigate, session, vehicle, app } = useSessionScreen("adjust");
  const [draft, setDraft] = useState({
    corner: "LF" as Corner,
    adjusterType: "spring_seat" as AdjustmentType,
    direction: "increase" as AdjustmentDirection,
    amount: "",
    amountUnit: "turn" as AdjustmentAmountUnit,
    reason: ""
  });

  if (!session || !vehicle) {
    return <SessionNotFound />;
  }

  const measurement = session.measurements.at(-1);
  if (!measurement) {
    return <SessionNotFound />;
  }

  const guidance = getCrossWeightGuidance({
    calculations: measurement.calculations,
    targetCrossPct: session.targetCrossPct,
    tolerancePct: session.crossTolerancePct,
    selectedCrossConvention: session.setupSnapshot.selectedCrossConvention,
    coiloverType: vehicle.coiloverType
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <SurfaceCard title="Qualitative diagonal guidance" eyebrow="Adjustment">
        <StatusBadge tone={guidance.status === "within" ? "success" : guidance.status === "identify_architecture" ? "warning" : "info"}>
          {guidance.status}
        </StatusBadge>
        <h3 className="mt-4 text-h3 font-semibold text-ink">{guidance.headline}</h3>
        <p className="mt-2 text-body text-muted">{guidance.message}</p>
        <p className="mt-2 text-small text-muted">{guidance.disclaimer}</p>
        <ul className="mt-4 space-y-2 text-small text-ink">
          {guidance.actions.map((action) => (
            <li key={`${action.corner}-${action.direction}`}>{action.summary}</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Corner"
            value={draft.corner}
            onChange={(event) =>
              setDraft((current) => ({ ...current, corner: event.target.value as Corner }))
            }
          >
            {cornerLabels.map((corner) => (
              <option key={corner} value={corner}>
                {corner}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Adjuster type"
            value={draft.adjusterType}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                adjusterType: event.target.value as AdjustmentType
              }))
            }
          >
            <option value="spring_seat">Spring seat</option>
            <option value="lower_mount_height">Lower mount height</option>
            <option value="torsion_bar">Torsion bar</option>
            <option value="shim">Shim</option>
            <option value="other">Other</option>
          </SelectField>
          <SelectField
            label="Direction"
            value={draft.direction}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                direction: event.target.value as AdjustmentDirection
              }))
            }
          >
            <option value="increase">Increase supported load</option>
            <option value="decrease">Decrease supported load</option>
          </SelectField>
          <InputField
            label="Amount"
            inputMode="decimal"
            type="number"
            value={draft.amount}
            onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
          />
          <SelectField
            label="Amount unit"
            value={draft.amountUnit}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                amountUnit: event.target.value as AdjustmentAmountUnit
              }))
            }
          >
            <option value="turn">Turns</option>
            <option value="mm">Millimeters</option>
            <option value="in">Inches</option>
            <option value="custom">Custom</option>
          </SelectField>
          <TextAreaField
            label="Reason"
            value={draft.reason}
            onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
            placeholder="Document why this change was chosen."
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(session.id, "results"))}>
            Back to results
          </Button>
          <Button
            onClick={() => {
              const adjustment = app.logAdjustment(session.id, {
                corner: draft.corner,
                adjusterType: draft.adjusterType,
                direction: draft.direction,
                amount: Number(draft.amount),
                amountUnit: draft.amountUnit,
                reason: draft.reason
              });
              if (adjustment) {
                navigate(buildSessionStepPath(session.id, "settle"));
              }
            }}
            disabled={!draft.reason.trim() || !draft.amount}
          >
            Save adjustment
          </Button>
        </div>
      </SurfaceCard>
      <div className="space-y-4">
        <StepIllustration assetId={trainingAssets.crossWeightAdjustment.id} />
        <SafetyComparison
          assetId={supportingAssets.coiloverArchitecture.id}
          summary="The architecture must be identified before any corner-specific turn guidance would be safe to claim."
        />
      </div>
    </div>
  );
}

export function SettleScreen() {
  const { navigate, session } = useSessionScreen("settle");
  const [checks, setChecks] = useState({
    roll: false,
    settle: false,
    clear: false
  });

  if (!session) {
    return <SessionNotFound />;
  }

  const readyToContinue = Object.values(checks).every(Boolean);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <SurfaceCard title="Repeat the settling routine" eyebrow="Settle">
        <p className="mt-2 text-body text-muted">
          Every change requires a controlled resettle before the next measurement can be treated as valid.
        </p>
        <div className="mt-4 space-y-3">
          {[
            { key: "roll" as const, label: "Roll or settle the car in your normal repeatable manner." },
            { key: "settle" as const, label: "Wait for all four readings to stabilize before recording." },
            { key: "clear" as const, label: "Confirm nothing is touching or binding the floating pad surfaces." }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-start gap-3 rounded-2xl border border-border bg-canvas p-3">
              <input
                type="checkbox"
                checked={checks[key]}
                onChange={(event) =>
                  setChecks((current) => ({ ...current, [key]: event.target.checked }))
                }
                className="mt-1 h-5 w-5"
              />
              <span className="text-small text-ink">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(session.id, "adjust"))}>
            Back to adjustment
          </Button>
          <Button
            onClick={() => navigate(buildSessionStepPath(session.id, "baseline"))}
            disabled={!readyToContinue}
          >
            Continue to remeasurement
          </Button>
        </div>
      </SurfaceCard>
      <StepIllustration assetId={trainingAssets.suspensionSettling.id} />
    </div>
  );
}

export function FinalizationScreen() {
  const { app, navigate, session } = useSessionScreen("finalize");

  if (!session) {
    return <SessionNotFound />;
  }

  const resolved = checklistIsResolved(session.finalChecklist);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <CriticalWarning title="Post-adjustment caution" tone="danger">
          After ride-height changes, verify wheel torque and complete an alignment before high-speed use.
        </CriticalWarning>
        <ChecklistGroup
          title="Final mechanical checklist"
          checklist={session.finalChecklist}
          onToggle={(item, checked) => updateChecklist(app, session, "finalChecklist", item, checked)}
          onOverrideReasonChange={(item, reason) =>
            app.updateChecklistItem(session.id, "finalChecklist", item.id, {
              overrideReason: reason
            })
          }
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(buildSessionStepPath(session.id, "results"))}>
            Back to results
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              app.completeSession(session.id, true);
              navigate(buildSessionStepPath(session.id, "report"));
            }}
            disabled={!resolved}
          >
            Complete with alignment pending
          </Button>
          <Button
            onClick={() => {
              app.completeSession(session.id, false);
              navigate(buildSessionStepPath(session.id, "report"));
            }}
            disabled={!resolved}
          >
            Complete and review report
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <StepIllustration assetId={trainingAssets.swayBarSetup.id} />
        <StepIllustration assetId={trainingAssets.finalVerification.id} />
        <SafetyComparison
          assetId={supportingAssets.alignment.id}
          summary="Alignment verification remains a live checklist state, not an image-only warning."
        />
      </div>
    </div>
  );
}

export function ReportScreen() {
  const { session, vehicle } = useSessionScreen("report");

  if (!session || !vehicle) {
    return <SessionNotFound />;
  }

  const baseline = session.measurements[0];
  const finalMeasurement = session.measurements.at(-1);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <SurfaceCard title="Session report preview" eyebrow="Report">
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge tone="info">{vehicle.nickname}</StatusBadge>
            <StatusBadge tone={session.status === "complete" ? "success" : "warning"}>
              {session.status}
            </StatusBadge>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <MetricCard label="Baseline cross %" value={formatMetric(baseline?.calculations.selectedCrossPct)} />
            <MetricCard label="Final cross %" value={formatMetric(finalMeasurement?.calculations.selectedCrossPct)} />
            <MetricCard label="Adjustments" value={String(session.adjustments.length)} />
            <MetricCard label="Iterations" value={String(session.measurements.length)} />
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-canvas p-3 text-small text-muted">
            Exports use the live session payload and do not depend on network access once the data and assets are cached.
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                downloadTextFile(
                  `${vehicle.nickname.replaceAll(" ", "-").toLowerCase()}-${session.id}.json`,
                  "application/json",
                  buildSessionJson(vehicle, session)
                )
              }
            >
              Export JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadTextFile(
                  `${vehicle.nickname.replaceAll(" ", "-").toLowerCase()}-${session.id}.csv`,
                  "text/csv",
                  buildSessionCsv(vehicle, session)
                )
              }
            >
              Export CSV
            </Button>
            <Button
              onClick={async () => {
                const pdfBytes = await buildSessionPdf(vehicle, session);
                downloadBinaryFile(
                  `${vehicle.nickname.replaceAll(" ", "-").toLowerCase()}-${session.id}.pdf`,
                  "application/pdf",
                  pdfBytes
                );
              }}
            >
              Export PDF
            </Button>
          </div>
        </SurfaceCard>
      </div>
      <StepIllustration assetId={trainingAssets.finalVerification.id} />
    </div>
  );
}
