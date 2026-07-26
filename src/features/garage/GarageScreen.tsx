import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCornerBalanceApp, type VehicleDraftInput } from "../../app/context";
import { supportingAssets } from "../../assets/registry";
import { CornerDiagram } from "../../components/illustrations/CornerDiagram";
import { InputField, SelectField, TextAreaField } from "../../components/forms/FormField";
import { buildSessionStepPath } from "../../components/ui/buildSessionStepPath";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import type { CoiloverType, Session, Vehicle, VehicleUse } from "../../domain/types";
import {
  filterSessionsByStatus,
  getLatestNonArchivedSession,
  getSessionLaunchStep,
  type ActiveSessionFilter
} from "../../domain/workflow/sessionHistory";
import { getVehicleDeletionGuard } from "../../domain/workflow/vehicleManagement";

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

interface GarageNotice {
  tone: "success" | "warning" | "info";
  text: string;
}

function createGarageDraft(overrides: Partial<GarageDraft> = {}): GarageDraft {
  return {
    nickname: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    primaryUse: "autocross",
    coiloverType: "unknown",
    preferredWeightUnit: "lb",
    preferredHeightUnit: "in",
    notes: "",
    ...overrides
  };
}

function mapVehicleToDraft(vehicle: Vehicle): GarageDraft {
  return createGarageDraft({
    nickname: vehicle.nickname,
    year: vehicle.year?.toString() ?? "",
    make: vehicle.make ?? "",
    model: vehicle.model ?? "",
    trim: vehicle.trim ?? "",
    primaryUse: vehicle.primaryUse,
    coiloverType: vehicle.coiloverType,
    preferredWeightUnit: vehicle.preferredWeightUnit,
    preferredHeightUnit: vehicle.preferredHeightUnit,
    notes: vehicle.notes ?? ""
  });
}

function toVehicleDraftInput(draft: GarageDraft): VehicleDraftInput {
  return {
    nickname: draft.nickname,
    year: draft.year ? Number(draft.year) : undefined,
    make: draft.make,
    model: draft.model,
    trim: draft.trim,
    primaryUse: draft.primaryUse,
    coiloverType: draft.coiloverType,
    preferredWeightUnit: draft.preferredWeightUnit,
    preferredHeightUnit: draft.preferredHeightUnit,
    notes: draft.notes
  };
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getSessionStatusTone(session: Session) {
  return session.status === "complete"
    ? "success"
    : session.status === "alignment_pending"
      ? "warning"
      : session.status === "archived"
        ? "neutral"
        : "info";
}

function getSessionActionLabel(session: Session) {
  return session.status === "complete" || session.status === "alignment_pending"
    ? "Open report"
    : "Resume";
}

function getNoticeClassName(tone: GarageNotice["tone"]) {
  return tone === "success"
    ? "border-success/20 bg-success/10 text-success"
    : tone === "warning"
      ? "border-warning/20 bg-warning/10 text-warning"
      : "border-primary/20 bg-primary-tint text-primary";
}

export function GarageScreen() {
  const navigate = useNavigate();
  const app = useCornerBalanceApp();
  const [historyFilter, setHistoryFilter] = useState<ActiveSessionFilter>("all");
  const [draft, setDraft] = useState<GarageDraft>(() => createGarageDraft());
  const [editingVehicleId, setEditingVehicleId] = useState<string>();
  const [editDraft, setEditDraft] = useState<GarageDraft>(() => createGarageDraft());
  const [notice, setNotice] = useState<GarageNotice>();

  function handleCreateVehicle() {
    if (!draft.nickname.trim()) {
      return;
    }

    const vehicle = app.createVehicle(toVehicleDraftInput(draft));

    setDraft(
      createGarageDraft({
        primaryUse: draft.primaryUse,
        coiloverType: draft.coiloverType,
        preferredWeightUnit: draft.preferredWeightUnit,
        preferredHeightUnit: draft.preferredHeightUnit
      })
    );

    const session = app.createSession(vehicle.id);
    if (session) {
      navigate(buildSessionStepPath(session.id, "setup"));
    }
  }

  function handleStartEditing(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id);
    setEditDraft(mapVehicleToDraft(vehicle));
    setNotice(undefined);
  }

  function handleCancelEditing() {
    setEditingVehicleId(undefined);
    setEditDraft(createGarageDraft());
  }

  function handleSaveVehicle(vehicleId: string) {
    if (!editDraft.nickname.trim()) {
      return;
    }

    const nickname = editDraft.nickname.trim();
    app.updateVehicle(vehicleId, toVehicleDraftInput(editDraft));
    setEditingVehicleId(undefined);
    setEditDraft(createGarageDraft());
    setNotice({
      tone: "success",
      text: `Saved profile updates for ${nickname}.`
    });
  }

  async function handleDeleteVehicle(vehicle: Vehicle) {
    const result = await app.deleteVehicle(vehicle.id);

    if (!result.ok) {
      setNotice({
        tone: "warning",
        text: result.reason ?? `Unable to delete ${vehicle.nickname}.`
      });
      return;
    }

    setEditingVehicleId((current) => (current === vehicle.id ? undefined : current));
    setEditDraft(createGarageDraft());
    setNotice({
      tone: result.message ? "warning" : "success",
      text: result.message ?? `Deleted the empty profile for ${vehicle.nickname}.`
    });
  }

  const filteredSessions = filterSessionsByStatus(app.sessions, historyFilter);

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
              <option value="single_adjuster_spring_perch">
                Spring perch adjusts load/height together
              </option>
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
          {notice ? (
            <div
              role="status"
              aria-live="polite"
              className={`mt-4 rounded-2xl border px-3 py-3 text-small font-medium ${getNoticeClassName(
                notice.tone
              )}`}
            >
              {notice.text}
            </div>
          ) : null}
          {app.vehicles.length === 0 ? (
            <p className="mt-2 text-body text-muted">
              Your garage is empty. Add the first vehicle above to start a session.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {app.vehicles.map((vehicle) => {
                const vehicleSessions = app.sessions.filter((session) => session.vehicleId === vehicle.id);
                const latestLiveSession = getLatestNonArchivedSession(vehicleSessions);
                const latestSession = vehicleSessions
                  .slice()
                  .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
                const activeCount = vehicleSessions.filter(
                  (session) => session.status === "draft" || session.status === "active"
                ).length;
                const completedCount = vehicleSessions.filter(
                  (session) =>
                    session.status === "complete" || session.status === "alignment_pending"
                ).length;
                const archivedCount = vehicleSessions.filter(
                  (session) => session.status === "archived"
                ).length;
                const deletionGuard = getVehicleDeletionGuard(vehicle.id, app.sessions);
                const editing = editingVehicleId === vehicle.id;

                return (
                  <li key={vehicle.id} className="rounded-2xl border border-border bg-canvas p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <h3 className="text-h3 font-semibold text-ink">{vehicle.nickname}</h3>
                        <p className="text-small text-muted">
                          {[vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone="info">{vehicle.primaryUse}</StatusBadge>
                          <StatusBadge tone="neutral">{vehicle.preferredWeightUnit}</StatusBadge>
                          <StatusBadge tone="neutral">{vehicle.preferredHeightUnit}</StatusBadge>
                          <StatusBadge tone="neutral">{activeCount} active</StatusBadge>
                          <StatusBadge tone="success">{completedCount} completed</StatusBadge>
                          <StatusBadge tone="neutral">{archivedCount} archived</StatusBadge>
                        </div>
                        {vehicle.notes ? <p className="text-small text-muted">{vehicle.notes}</p> : null}
                        {latestSession ? (
                          <p className="text-small text-muted">
                            Latest session updated {formatTimestamp(latestSession.updatedAt)}.
                          </p>
                        ) : (
                          <p className="text-small text-muted">
                            No sessions saved for this vehicle yet.
                          </p>
                        )}
                        {!deletionGuard.canDelete ? (
                          <p className="text-small text-warning">
                            Delete locked while {deletionGuard.relatedSessionCount} saved session
                            {deletionGuard.relatedSessionCount === 1 ? "" : "s"} still reference this
                            profile.
                          </p>
                        ) : (
                          <p className="text-small text-muted">
                            Empty profiles can be deleted safely before they accumulate history.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {latestLiveSession ? (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              navigate(
                                buildSessionStepPath(
                                  latestLiveSession.id,
                                  getSessionLaunchStep(latestLiveSession)
                                )
                              )
                            }
                          >
                            {getSessionActionLabel(latestLiveSession)}
                          </Button>
                        ) : null}
                        {latestSession ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const session = app.createSessionFromTemplate(latestSession.id);
                              if (session) {
                                navigate(buildSessionStepPath(session.id, "setup"));
                              }
                            }}
                          >
                            Repeat last setup
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => {
                            const session = app.createSession(vehicle.id);
                            if (session) {
                              navigate(buildSessionStepPath(session.id, "setup"));
                            }
                          }}
                        >
                          Start fresh session
                        </Button>
                        <Button variant="secondary" onClick={() => handleStartEditing(vehicle)}>
                          Edit profile
                        </Button>
                        <Button
                          variant="danger"
                          disabled={!deletionGuard.canDelete}
                          title={deletionGuard.reason}
                          onClick={() => void handleDeleteVehicle(vehicle)}
                        >
                          Delete empty profile
                        </Button>
                      </div>
                    </div>
                    {editing ? (
                      <div className="mt-4 rounded-2xl border border-border bg-white p-4">
                        <p className="text-small font-semibold uppercase tracking-[0.12em] text-primary">
                          Edit vehicle profile
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <InputField
                            label="Nickname"
                            value={editDraft.nickname}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                nickname: event.target.value
                              }))
                            }
                          />
                          <InputField
                            label="Year"
                            inputMode="numeric"
                            value={editDraft.year}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                year: event.target.value
                              }))
                            }
                          />
                          <InputField
                            label="Make"
                            value={editDraft.make}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                make: event.target.value
                              }))
                            }
                          />
                          <InputField
                            label="Model"
                            value={editDraft.model}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                model: event.target.value
                              }))
                            }
                          />
                          <InputField
                            label="Trim"
                            value={editDraft.trim}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                trim: event.target.value
                              }))
                            }
                          />
                          <SelectField
                            label="Primary use"
                            value={editDraft.primaryUse}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                primaryUse: event.target.value as VehicleUse
                              }))
                            }
                          >
                            <option value="autocross">Autocross</option>
                            <option value="road_course">Road course</option>
                            <option value="street">Street</option>
                            <option value="other">Other</option>
                          </SelectField>
                          <SelectField
                            label="Coilover architecture"
                            value={editDraft.coiloverType}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                coiloverType: event.target.value as CoiloverType
                              }))
                            }
                          >
                            <option value="unknown">Unknown</option>
                            <option value="single_adjuster_spring_perch">
                              Spring perch adjusts load/height together
                            </option>
                            <option value="separate_height_and_preload">
                              Separate height and preload
                            </option>
                            <option value="non_coilover_adjustable">Non-coilover adjustable</option>
                          </SelectField>
                          <SelectField
                            label="Weight unit"
                            value={editDraft.preferredWeightUnit}
                            onChange={(event) =>
                              setEditDraft((current) => ({
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
                            value={editDraft.preferredHeightUnit}
                            onChange={(event) =>
                              setEditDraft((current) => ({
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
                            value={editDraft.notes}
                            onChange={(event) =>
                              setEditDraft((current) => ({
                                ...current,
                                notes: event.target.value
                              }))
                            }
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <Button variant="text" onClick={handleCancelEditing}>
                            Cancel
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={!editDraft.nickname.trim()}
                            onClick={() => handleSaveVehicle(vehicle.id)}
                          >
                            Save changes
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </SurfaceCard>

        <SurfaceCard title="Session history" eyebrow="History">
          <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <SelectField
              label="History filter"
              value={historyFilter}
              onChange={(event) => setHistoryFilter(event.target.value as ActiveSessionFilter)}
            >
              <option value="all">All sessions</option>
              <option value="active">Draft and active</option>
              <option value="completed">Completed and alignment pending</option>
              <option value="archived">Archived</option>
            </SelectField>
            <div className="rounded-2xl border border-border bg-canvas p-3 text-small text-muted">
              Archive hides a session from the normal resume flow without deleting its measurements,
              adjustments, reports, or comparison value. You can restore it later.
            </div>
          </div>
          {filteredSessions.length === 0 ? (
            <p className="mt-4 text-body text-muted">No sessions match the current filter yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {filteredSessions.map((session) => {
                const vehicle = app.getVehicle(session.vehicleId);

                return (
                  <li key={session.id} className="rounded-2xl border border-border bg-canvas p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-h3 font-semibold text-ink">
                            {vehicle?.nickname ?? "Unknown vehicle"}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge tone={getSessionStatusTone(session)}>
                              {session.status}
                            </StatusBadge>
                            <StatusBadge tone="neutral">{session.currentStep}</StatusBadge>
                            {session.status === "archived" && session.archivedFromStatus ? (
                              <StatusBadge tone="neutral">
                                archived from {session.archivedFromStatus}
                              </StatusBadge>
                            ) : null}
                          </div>
                          <p className="text-small text-muted">
                            Updated {formatTimestamp(session.updatedAt)}
                            {" • "}Measurements {session.measurements.length}
                            {" • "}Adjustments {session.adjustments.length}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {session.status === "archived" ? (
                            <Button variant="secondary" onClick={() => app.restoreSession(session.id)}>
                              Restore
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  navigate(
                                    buildSessionStepPath(session.id, getSessionLaunchStep(session))
                                  )
                                }
                              >
                                {getSessionActionLabel(session)}
                              </Button>
                              <Button variant="text" onClick={() => app.archiveSession(session.id)}>
                                Archive
                              </Button>
                            </>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const nextSession = app.createSessionFromTemplate(session.id);
                              if (nextSession) {
                                navigate(buildSessionStepPath(nextSession.id, "setup"));
                              }
                            }}
                          >
                            Repeat setup
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => navigate("/compare")}>
              Compare saved sessions
            </Button>
          </div>
        </SurfaceCard>
      </div>
      <CornerDiagram
        assetId={supportingAssets.fourCornerOrientation.id}
        summary="The garage now acts as a real workshop hub: vehicle profiles, active work, archived history, and repeatable setup templates all share the same canonical car orientation."
      />
    </div>
  );
}
