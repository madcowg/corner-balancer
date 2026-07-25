import { getVisualAsset, type VisualAssetId } from "../../assets/registry";

export interface StepIllustrationProps {
  assetId: VisualAssetId;
  caption?: string;
  longDescription?: string;
}

export function StepIllustration({
  assetId,
  caption,
  longDescription
}: StepIllustrationProps) {
  const asset = getVisualAsset(assetId);

  return (
    <figure className="overflow-hidden rounded-card border border-border bg-surface shadow-panel">
      <div
        className="relative overflow-hidden border-b border-border bg-canvas"
        style={{ aspectRatio: asset.aspectRatio.replace(":", " / ") }}
      >
        <img className="h-full w-full object-cover" src={asset.src} alt={asset.alt} loading="lazy" />
        {asset.status !== "approved" ? (
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-warning/20 bg-warning/10 px-3 py-2 text-small font-medium text-warning">
            Design asset pending. The final approved Figma export must replace this placeholder before release.
          </div>
        ) : null}
      </div>
      <figcaption className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-tint px-2 py-1 text-caption font-semibold uppercase tracking-[0.14em] text-primary">
            {asset.id}
          </span>
          <span className="rounded-full border border-border px-2 py-1 text-caption text-muted">
            {asset.filename}
          </span>
          <span className="rounded-full border border-border px-2 py-1 text-caption text-muted">
            {asset.status}
          </span>
        </div>
        {caption ? <p className="text-body font-medium text-ink">{caption}</p> : null}
        <p className="text-small text-muted">{longDescription ?? asset.alt}</p>
      </figcaption>
    </figure>
  );
}
