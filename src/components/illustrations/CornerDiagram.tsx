import type { VisualAssetId } from "../../assets/registry";

import { StepIllustration } from "./StepIllustration";

export interface CornerDiagramProps {
  assetId: VisualAssetId;
  summary: string;
}

export function CornerDiagram({ assetId, summary }: CornerDiagramProps) {
  return (
    <StepIllustration
      assetId={assetId}
      caption="Live values and corner labels stay outside the exported SVG."
      longDescription={summary}
    />
  );
}
