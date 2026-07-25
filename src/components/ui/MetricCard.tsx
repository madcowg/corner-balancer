export interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-canvas p-3">
      <p className="text-caption uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-numeric font-bold text-ink">{value}</p>
      {helper ? <p className="mt-1 text-small text-muted">{helper}</p> : null}
    </div>
  );
}
