import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supportingAssets } from "../../assets/registry";
import { CornerDiagram } from "../../components/illustrations/CornerDiagram";
import { InputField, SelectField, TextAreaField } from "../../components/forms/FormField";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useCornerBalanceApp } from "../../app/context";
import type { VehicleUse, CoiloverType } from "../../domain/types";
import { buildSessionStepPath } from "../../components/ui/buildSessionStepPath";

interface GarageDraft {
  nickname: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  primaryUse: VehicleUse;
  coiloverType: CoiloverType;
  preferredWeightUnit: "lb" | "kg";
  preferredHeightUnit: "in" | "mm";
  notes: string;
}

export function GarageScreen() {
  const navigate = useNavigate();
  const app = useCornerBalanceApp();
  const [draft, setDraft] = useState<GarageDraft>({
    nickname: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    primaryUse: "autocross" as VehicleUse,
    coiloverType: "unknown" as CoiloverType,
    preferredWeightUnit: "lb" as const,
    preferredHeightUnit: "in" as const,
    notes: ""
  });

  function handleCreateVehicle() {
    if (!draft.nickname.trim()) {
      return;
    }

    const vehicle = app.createVehicle({
      nickname: draft.nickname,
      ...(draft.year ? { year: Number(draft.year) } : {}),
      ...(draft.make ? { make: draft.make } : {}),
      ...(draft.model ? { model: draft.model } : {}),
      ...(draft.trim ? { trim: draft.trim } : {}),
      primaryUse: draft.primaryUse,
      coiloverType: draft.coiloverType,
      preferredWeightUnit: draft.preferredWeightUnit,
      preferredHeightUnit: draft.preferredHeightUnit,
      ...(draft.notes ? { notes: draft.notes } : {})
    });

    setDraft({
      nickname: "",
      year: "",
      make: "",
      model: "",
      trim: "",
      primaryUse: draft.primaryUse,
      coiloverType: draft.coiloverType,
      preferredWeightUnit: draft.preferredWeightUnit,
      preferredHeightUnit: draft.preferredHeightUnit,
      notes: ""
    });

    const session = app.createSession(vehicle.id);
    if (session) {
      navigate(buildSessionStepPath(session.id, "setup"));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <SurfaceCard title="Add a vehicle" eyebrow="Garage">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InputField
              label="Nickname"
              value={draft.nickname}
              onChange={(event) => setDraft((current) => ({ ...current, nickname: event.target.value }))}
              placeholder="Street STX Miata"
            />
            <InputField
              label="Year"
              inputMode="numeric"
              value={draft.year}
              onChange={(event) => setDraft((current) => ({ ...current, year: event.target.value }))}
              placeholder="2002"
            />
            <InputField
              label="Make"
              value={draft.make}
              onChange={(event) => setDraft((current) => ({ ...current, make: event.target.value }))}
            />
            <InputField
              label="Model"
              value={draft.model}
              onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
            />
            <InputField
              label="Trim"
              value={draft.trim}
              onChange={(event) => setDraft((current) => ({ ...current, trim: event.target.value }))}
            />
            <SelectField
              label="Primary use"
              value={draft.primaryUse}
              onChange={(event) =>
                setDraft((current) => ({ ...current, primaryUse: event.target.value as VehicleUse }))
              }
            >
              <option value="autocross">Autocross</option>
              <option value="road_course">Road course</option>
              <option value="street">Street</option>
              <option value="other">Other</option>
            </SelectField>
            <SelectField
              label="Coilover architecture"
              value={draft.coiloverType}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  coiloverType: event.target.value as CoiloverType
                }))
              }
            >
              <option value="unknown">Unknown</option>
              <option value="single_adjuster_spring_perch">Spring perch adjusts load/height together</option>
              <option value="separate_height_and_preload">Separate height and preload</option>
              <option value="non_coilover_adjustable">Non-coilover adjustable</option>
            </SelectField>
            <SelectField
              label="Weight unit"
              value={draft.preferredWeightUnit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  preferredWeightUnit: event.target.value as "lb" | "kg"
                }))
              }
            >
              <option value="lb">Pounds</option>
              <option value="kg">Kilograms</option>
            </SelectField>
            <SelectField
              label="Height unit"
              value={draft.preferredHeightUnit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  preferredHeightUnit: event.target.value as "in" | "mm"
                }))
              }
            >
              <option value="in">Inches</option>
              <option value="mm">Millimeters</option>
            </SelectField>
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Vehicle notes"
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Spring notes, sway-bar notes, alignment notes, tire notes..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCreateVehicle} disabled={!draft.nickname.trim()}>
              Save vehicle and start setup
            </Button>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Saved vehicles" eyebrow="Garage">
          {app.vehicles.length === 0 ? (
            <p className="mt-2 text-body text-muted">
              Your garage is empty. Add the first vehicle above to start a session.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {app.vehicles.map((vehicle) => (
                <li key={vehicle.id} className="rounded-2xl border border-border bg-canvas p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-h3 font-semibold text-ink">{vehicle.nickname}</h3>
                      <p className="text-small text-muted">
                        {[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="info">{vehicle.primaryUse}</StatusBadge>
                        <StatusBadge tone="neutral">{vehicle.preferredWeightUnit}</StatusBadge>
                        <StatusBadge tone="neutral">{vehicle.preferredHeightUnit}</StatusBadge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const session = app.createSession(vehicle.id);
                          if (session) {
                            navigate(buildSessionStepPath(session.id, "setup"));
                          }
                        }}
                      >
                        Start session
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      </div>
      <CornerDiagram
        assetId={supportingAssets.fourCornerOrientation.id}
        summary="The garage stores the suspension architecture and preferred units that the session flow will inherit."
      />
    </div>
  );
}
