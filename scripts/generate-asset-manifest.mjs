import fs from "node:fs";
import path from "node:path";

import {
  getProjectRoot,
  loadManifestEntries,
  validateManifestEntries
} from "./asset-manifest-utils.mjs";

const projectRoot = getProjectRoot();
const entries = loadManifestEntries(projectRoot);
const validation = validateManifestEntries(entries, { projectRoot, requireFiles: false });

if (validation.errors.length > 0) {
  console.error(validation.errors.join("\n"));
  process.exit(1);
}

const assetIds = entries.map((entry) => JSON.stringify(entry.asset_id)).join(" | ");
const assetMap = entries
  .map(
    (entry) => `  ${JSON.stringify(entry.asset_id)}: {
    id: ${JSON.stringify(entry.asset_id)},
    filename: ${JSON.stringify(entry.filename)},
    src: ${JSON.stringify(`/assets/corner-balance/${entry.filename}`)},
    alt: ${JSON.stringify(entry.alt_text)},
    aspectRatio: ${JSON.stringify(entry.aspect_ratio)},
    status: ${JSON.stringify(entry.status)},
    category: ${JSON.stringify(entry.category)},
    screen: ${JSON.stringify(entry.screen)},
    component: ${JSON.stringify(entry.component)},
    figmaFrame: ${JSON.stringify(entry.figma_frame)},
    version: ${Number(entry.version)}
  }`
  )
  .join(",\n");

const generatedSource = `/* This file is auto-generated from public/data/assets-manifest.csv. */
export type AssetStatus = "draft" | "review" | "approved" | "deprecated";
export type VisualAssetId = ${assetIds};

export interface VisualAsset {
  id: VisualAssetId;
  filename: string;
  src: string;
  alt: string;
  aspectRatio: string;
  status: AssetStatus;
  category: string;
  screen: string;
  component: string;
  figmaFrame: string;
  version: number;
}

export const visualAssets = {
${assetMap}
} as const satisfies Record<VisualAssetId, VisualAsset>;

export const visualAssetList = Object.values(visualAssets);
`;

fs.writeFileSync(
  path.join(projectRoot, "src", "assets", "manifest.generated.ts"),
  generatedSource,
  "utf8"
);

console.log(`Generated src/assets/manifest.generated.ts with ${entries.length} assets.`);
