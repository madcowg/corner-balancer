import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_ASSET_IDS = [
  "STEP-01",
  "STEP-02",
  "STEP-03",
  "STEP-04",
  "STEP-05",
  "STEP-06",
  "STEP-07",
  "STEP-08",
  "DIAGRAM-FOUR-CORNER",
  "DIAGRAM-SCALE-PAD-STATES",
  "DIAGRAM-COILOVER-ARCHITECTURE",
  "DIAGRAM-CROSS-WEIGHT",
  "SAFETY-JACK-SUPPORT",
  "SAFETY-PAD-INTERFERENCE",
  "SAFETY-SWAY-LINK",
  "SAFETY-TIRE-CENTERING",
  "SAFETY-COLLAR-LOCK",
  "SAFETY-ALIGNMENT"
];

export const ALLOWED_STATUSES = new Set(["draft", "review", "approved", "deprecated"]);
export const ALLOWED_FORMATS = new Set(["svg", "png", "webp"]);
const REQUIRED_COLUMNS = [
  "asset_id",
  "filename",
  "category",
  "screen",
  "component",
  "format",
  "aspect_ratio",
  "alt_text",
  "status",
  "figma_frame",
  "version"
];

export function getProjectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function getManifestPath(projectRoot = getProjectRoot()) {
  return path.join(projectRoot, "public", "data", "assets-manifest.csv");
}

export function getAssetOutputPath(filename, projectRoot = getProjectRoot()) {
  return path.join(projectRoot, "public", "assets", "corner-balance", filename);
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && character === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += character;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function loadManifestEntries(projectRoot = getProjectRoot()) {
  const manifestPath = getManifestPath(projectRoot);
  const rawText = fs.readFileSync(manifestPath, "utf8");
  const [headerRow, ...dataRows] = parseCsv(rawText);

  if (!headerRow) {
    throw new Error("Asset manifest is empty.");
  }

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headerRow.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Asset manifest is missing columns: ${missingColumns.join(", ")}`);
  }

  return dataRows.map((row) =>
    Object.fromEntries(headerRow.map((column, index) => [column, row[index] ?? ""]))
  );
}

export function validateManifestEntries(entries, { projectRoot = getProjectRoot(), mode = "development", requireFiles = true } = {}) {
  const errors = [];
  const seenIds = new Set();
  const seenFilenames = new Set();

  for (const entry of entries) {
    for (const column of REQUIRED_COLUMNS) {
      if (!entry[column] || entry[column].trim().length === 0) {
        errors.push(`Asset ${entry.asset_id || "<unknown>"} is missing required field "${column}".`);
      }
    }

    if (seenIds.has(entry.asset_id)) {
      errors.push(`Duplicate asset_id detected: ${entry.asset_id}`);
    }
    seenIds.add(entry.asset_id);

    if (seenFilenames.has(entry.filename)) {
      errors.push(`Duplicate filename detected: ${entry.filename}`);
    }
    seenFilenames.add(entry.filename);

    if (!ALLOWED_STATUSES.has(entry.status)) {
      errors.push(`Asset ${entry.asset_id} has unsupported status "${entry.status}".`);
    }

    if (!ALLOWED_FORMATS.has(entry.format)) {
      errors.push(`Asset ${entry.asset_id} has unsupported format "${entry.format}".`);
    }

    if (entry.alt_text.trim().length === 0) {
      errors.push(`Asset ${entry.asset_id} must include alt_text.`);
    }

    if (!/^\d+:\d+$/.test(entry.aspect_ratio)) {
      errors.push(`Asset ${entry.asset_id} has invalid aspect_ratio "${entry.aspect_ratio}".`);
    }

    if (requireFiles) {
      const assetPath = getAssetOutputPath(entry.filename, projectRoot);
      if (!fs.existsSync(assetPath)) {
        errors.push(`Asset file is missing for ${entry.asset_id}: ${entry.filename}`);
      }
    }
  }

  for (const requiredAssetId of REQUIRED_ASSET_IDS) {
    if (!entries.some((entry) => entry.asset_id === requiredAssetId)) {
      errors.push(`Required asset ${requiredAssetId} is missing from assets-manifest.csv.`);
    }
  }

  if (mode === "release") {
    for (const entry of entries) {
      if (REQUIRED_ASSET_IDS.includes(entry.asset_id) && entry.status !== "approved") {
        errors.push(
          `Release validation failed because ${entry.asset_id} is ${entry.status}. Replace placeholders with approved Figma exports before shipping.`
        );
      }
    }
  }

  return { errors };
}

export function createAspectRatioStyle(aspectRatio) {
  const [width, height] = aspectRatio.split(":").map(Number);
  return { width, height };
}

export function toConstName(value) {
  return value.replace(/[^A-Z0-9]+/g, "_");
}
