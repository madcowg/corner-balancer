import { useState } from "react";

import { supportingAssets } from "../../assets/registry";
import { CornerDiagram } from "../../components/illustrations/CornerDiagram";
import { SelectField } from "../../components/forms/FormField";
import { MetricCard } from "../../components/ui/MetricCard";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useCornerBalanceApp } from "../../app/context";

function formatMetric(value?: number) {
  return value == null ? "--" : value.toFixed(2);
}

export function CompareScreen() {
  const app = useCornerBalanceApp();
  const [leftSessionId, setLeftSessionId] = useState(app.sessions[0]?.id ?? "");
  const [rightSessionId, setRightSessionId] = useState(app.sessions[1]?.id ?? app.sessions[0]?.id ?? "");
  const leftSession = leftSessionId ? app.getSession(leftSessionId) : undefined;
  const rightSession = rightSessionId ? app.getSession(rightSessionId) : undefined;
  const leftMeasurement = leftSession?.measurements.at(-1);
  const rightMeasurement = rightSession?.measurements.at(-1);

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
                  {session.id.slice(0, 8)} • {session.status}
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
                  {session.id.slice(0, 8)} • {session.status}
                </option>
              ))}
            </SelectField>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-2">
          <SurfaceCard title="Left" eyebrow="Session">
            <div className="mt-4 grid gap-3">
              <MetricCard label="Cross %" value={formatMetric(leftMeasurement?.calculations.selectedCrossPct)} />
              <MetricCard label="Total kg" value={formatMetric(leftMeasurement?.calculations.totalKg)} />
              <MetricCard label="Rake mm" value={formatMetric(leftMeasurement?.calculations.rakeMm)} />
            </div>
          </SurfaceCard>
          <SurfaceCard title="Right" eyebrow="Session">
            <div className="mt-4 grid gap-3">
              <MetricCard label="Cross %" value={formatMetric(rightMeasurement?.calculations.selectedCrossPct)} />
              <MetricCard label="Total kg" value={formatMetric(rightMeasurement?.calculations.totalKg)} />
              <MetricCard label="Rake mm" value={formatMetric(rightMeasurement?.calculations.rakeMm)} />
            </div>
          </SurfaceCard>
        </div>
      </div>

      <CornerDiagram
        assetId={supportingAssets.fourCornerOrientation.id}
        summary="Comparison reuses the canonical corner layout so before/after changes stay easy to scan on mobile."
      />
    </div>
  );
}
