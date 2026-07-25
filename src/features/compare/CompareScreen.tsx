import { useState } from "react";

import { supportingAssets } from "../../assets/registry";
import { CornerDiagram } from "../../components/illustrations/CornerDiagram";
import { SelectField } from "../../components/forms/FormField";
import { MetricCard } from "../../components/ui/MetricCard";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useCornerBalanceApp } from "../../app/context";
import { buildSessionSummary } from "../../domain/reporting/sessionSummary";

function formatMetric(value?: number) {
  return value == null ? "--" : value.toFixed(2);
}

function formatSignedMetric(value?: number, suffix = "") {
  if (value == null) {
    return `--${suffix}`;
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}${suffix}`;
}

function formatSessionLabel(sessionId: string, sessionLabel?: string) {
  return sessionLabel ? `${sessionLabel}` : sessionId.slice(0, 8);
}

export function CompareScreen() {
  const app = useCornerBalanceApp();
  const [leftSessionId, setLeftSessionId] = useState(app.sessions[0]?.id ?? "");
  const [rightSessionId, setRightSessionId] = useState(app.sessions[1]?.id ?? app.sessions[0]?.id ?? "");
  const leftSession = leftSessionId ? app.getSession(leftSessionId) : undefined;
  const rightSession = rightSessionId ? app.getSession(rightSessionId) : undefined;
  const leftVehicle = leftSession ? app.getVehicle(leftSession.vehicleId) : undefined;
  const rightVehicle = rightSession ? app.getVehicle(rightSession.vehicleId) : undefined;
  const leftSummary = leftSession ? buildSessionSummary(leftSession) : undefined;
  const rightSummary = rightSession ? buildSessionSummary(rightSession) : undefined;
  const comparisonReady =
    Boolean(leftSession) &&
    Boolean(rightSession) &&
    Boolean(leftSummary?.measurementCount) &&
    Boolean(rightSummary?.measurementCount);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <SurfaceCard title="Compare saved sessions" eyebrow="Compare">
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="Left session"
              value={leftSessionId}
              onChange={(event) => setLeftSessionId(event.target.value)}
            >
              <option value="">Select a session</option>
              {app.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {formatSessionLabel(
                    session.id,
                    `${app.getVehicle(session.vehicleId)?.nickname ?? "Unknown vehicle"} • ${session.status} • ${new Date(session.updatedAt).toLocaleDateString()}`
                  )}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Right session"
              value={rightSessionId}
              onChange={(event) => setRightSessionId(event.target.value)}
            >
              <option value="">Select a session</option>
              {app.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {formatSessionLabel(
                    session.id,
                    `${app.getVehicle(session.vehicleId)?.nickname ?? "Unknown vehicle"} • ${session.status} • ${new Date(session.updatedAt).toLocaleDateString()}`
                  )}
                </option>
              ))}
            </SelectField>
          </div>
          {comparisonReady ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MetricCard
                label="Final Cross Delta"
                value={formatSignedMetric(
                  (rightSummary?.finalCrossPct ?? 0) - (leftSummary?.finalCrossPct ?? 0),
                  "%"
                )}
                helper="Right minus left"
              />
              <MetricCard
                label="Target Error Delta"
                value={formatSignedMetric(
                  (rightSummary?.finalCrossErrorPct ?? 0) - (leftSummary?.finalCrossErrorPct ?? 0),
                  "%"
                )}
                helper="Closer to zero is better"
              />
              <MetricCard
                label="Adjustment Count Delta"
                value={formatSignedMetric(
                  (rightSummary?.adjustmentCount ?? 0) - (leftSummary?.adjustmentCount ?? 0)
                )}
                helper="Right minus left"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/10 p-3 text-small text-warning">
              Pick two sessions that both include at least one recorded measurement to unlock the full comparison summary.
            </div>
          )}
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-2">
          <SurfaceCard title="Left" eyebrow="Session">
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge tone="info">{leftVehicle?.nickname ?? "No vehicle"}</StatusBadge>
              <StatusBadge
                tone={
                  leftSession?.status === "complete"
                    ? "success"
                    : leftSession?.status === "alignment_pending"
                      ? "warning"
                      : "neutral"
                }
              >
                {leftSession?.status ?? "not selected"}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-3">
              <MetricCard
                label="Final cross %"
                value={formatMetric(leftSummary?.finalCrossPct)}
                helper={`Change ${formatSignedMetric(leftSummary?.crossChangePct, "%")}`}
              />
              <MetricCard
                label="Target error %"
                value={formatMetric(leftSummary?.finalCrossErrorPct)}
                helper={
                  leftSummary?.withinCrossTolerance ? "Within tolerance" : "Outside tolerance"
                }
              />
              <MetricCard
                label="Total kg"
                value={formatMetric(leftSummary?.finalTotalKg)}
                helper={`Change ${formatSignedMetric(leftSummary?.totalChangeKg, " kg")}`}
              />
              <MetricCard
                label="Rake mm"
                value={formatMetric(leftSummary?.finalRakeMm)}
                helper={`Change ${formatSignedMetric(leftSummary?.rakeChangeMm, " mm")}`}
              />
              <MetricCard
                label="Warnings"
                value={String(leftSummary?.warningCount ?? 0)}
                helper={leftSummary?.latestWarnings[0] ?? "No latest warnings"}
              />
              <MetricCard
                label="Checklist open"
                value={String(
                  (leftSummary?.safetyChecklist.unresolved ?? 0) +
                    (leftSummary?.finalChecklist.unresolved ?? 0)
                )}
                helper={`Iterations ${leftSummary?.measurementCount ?? 0} • Adjustments ${leftSummary?.adjustmentCount ?? 0}`}
              />
            </div>
          </SurfaceCard>
          <SurfaceCard title="Right" eyebrow="Session">
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge tone="info">{rightVehicle?.nickname ?? "No vehicle"}</StatusBadge>
              <StatusBadge
                tone={
                  rightSession?.status === "complete"
                    ? "success"
                    : rightSession?.status === "alignment_pending"
                      ? "warning"
                      : "neutral"
                }
              >
                {rightSession?.status ?? "not selected"}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-3">
              <MetricCard
                label="Final cross %"
                value={formatMetric(rightSummary?.finalCrossPct)}
                helper={`Change ${formatSignedMetric(rightSummary?.crossChangePct, "%")}`}
              />
              <MetricCard
                label="Target error %"
                value={formatMetric(rightSummary?.finalCrossErrorPct)}
                helper={
                  rightSummary?.withinCrossTolerance ? "Within tolerance" : "Outside tolerance"
                }
              />
              <MetricCard
                label="Total kg"
                value={formatMetric(rightSummary?.finalTotalKg)}
                helper={`Change ${formatSignedMetric(rightSummary?.totalChangeKg, " kg")}`}
              />
              <MetricCard
                label="Rake mm"
                value={formatMetric(rightSummary?.finalRakeMm)}
                helper={`Change ${formatSignedMetric(rightSummary?.rakeChangeMm, " mm")}`}
              />
              <MetricCard
                label="Warnings"
                value={String(rightSummary?.warningCount ?? 0)}
                helper={rightSummary?.latestWarnings[0] ?? "No latest warnings"}
              />
              <MetricCard
                label="Checklist open"
                value={String(
                  (rightSummary?.safetyChecklist.unresolved ?? 0) +
                    (rightSummary?.finalChecklist.unresolved ?? 0)
                )}
                helper={`Iterations ${rightSummary?.measurementCount ?? 0} • Adjustments ${rightSummary?.adjustmentCount ?? 0}`}
              />
            </div>
          </SurfaceCard>
        </div>
      </div>

      <CornerDiagram
        assetId={supportingAssets.fourCornerOrientation.id}
        summary="Comparison reuses the canonical corner layout so before/after cross-weight changes, warnings, and checklist outcomes stay easy to scan on mobile."
      />
    </div>
  );
}
