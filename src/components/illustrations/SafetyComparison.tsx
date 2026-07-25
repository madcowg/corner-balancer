import type { VisualAssetId } from "../../assets/registry";

import { StepIllustration } from "./StepIllustration";

export interface SafetyComparisonProps {
  assetId: VisualAssetId;
  summary: string;
}

export function SafetyComparison({ assetId, summary }: SafetyComparisonProps) {
  return (
    <StepIllustration
      assetId={assetId}
      caption="Safety-critical copy remains live text above the primary action."
      longDescription={summary}
    />
  );
}
