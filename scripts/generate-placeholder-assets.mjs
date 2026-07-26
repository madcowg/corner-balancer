import fs from "node:fs";
import path from "node:path";

import { getAssetOutputPath, getProjectRoot, loadManifestEntries } from "./asset-manifest-utils.mjs";

const projectRoot = getProjectRoot();
const entries = loadManifestEntries(projectRoot);

for (const entry of entries) {
  const assetPath = getAssetOutputPath(entry.filename, projectRoot);
  const outputDirectory = path.dirname(assetPath);
  const viewWidth = Number(entry.master_width_px);
  const viewHeight = Number(entry.master_height_px);

  fs.mkdirSync(outputDirectory, { recursive: true });

  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${viewHeight}" role="img" aria-labelledby="title desc">
  <title id="title">${entry.asset_id} placeholder</title>
  <desc id="desc">${entry.alt_text}</desc>
  <rect width="${viewWidth}" height="${viewHeight}" fill="#F6F7F9" />
  <rect x="48" y="48" width="${viewWidth - 96}" height="${viewHeight - 96}" rx="42" fill="#FFFFFF" stroke="#D9DFE8" stroke-width="8" />
  <rect x="88" y="88" width="${viewWidth - 176}" height="120" rx="28" fill="#E8F0FA" />
  <text x="120" y="164" fill="#2463A7" font-family="Inter, Segoe UI, sans-serif" font-size="44" font-weight="700">
    Design asset pending
  </text>
  <text x="120" y="292" fill="#1D2633" font-family="Inter, Segoe UI, sans-serif" font-size="82" font-weight="700">
    ${entry.asset_id}
  </text>
  <text x="120" y="368" fill="#657184" font-family="Inter, Segoe UI, sans-serif" font-size="40">
    ${entry.filename}
  </text>
  <text x="120" y="452" fill="#657184" font-family="Inter, Segoe UI, sans-serif" font-size="32">
    Placeholder only. Replace with the approved Figma export before release.
  </text>
  <text x="120" y="504" fill="#657184" font-family="Inter, Segoe UI, sans-serif" font-size="28">
    Master export size ${viewWidth} x ${viewHeight}
  </text>
  <g transform="translate(120 ${Math.min(viewHeight - 248, 560)})">
    <rect width="${viewWidth - 240}" height="140" rx="28" fill="#F6F7F9" stroke="#D9DFE8" stroke-width="6" />
    <text x="40" y="62" fill="#1D2633" font-family="Inter, Segoe UI, sans-serif" font-size="32" font-weight="600">
      Alt text
    </text>
    <text x="40" y="102" fill="#657184" font-family="Inter, Segoe UI, sans-serif" font-size="28">
      ${entry.alt_text}
    </text>
  </g>
</svg>
`;

  if (fs.existsSync(assetPath)) {
    const currentAsset = fs.readFileSync(assetPath, "utf8");
    if (!currentAsset.includes("Design asset pending")) {
      continue;
    }
  }

  fs.writeFileSync(assetPath, placeholderSvg, "utf8");
}

console.log(`Verified placeholder assets for ${entries.length} manifest entries.`);
