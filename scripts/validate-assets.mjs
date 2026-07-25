import path from "node:path";

import { getProjectRoot, loadManifestEntries, validateManifestEntries } from "./asset-manifest-utils.mjs";

const modeFlag = process.argv.find((argument) => argument.startsWith("--mode="));
const mode = modeFlag ? modeFlag.split("=")[1] : "development";
const projectRoot = getProjectRoot();
const entries = loadManifestEntries(projectRoot);
const validation = validateManifestEntries(entries, { projectRoot, mode, requireFiles: true });

if (validation.errors.length > 0) {
  console.error(validation.errors.join("\n"));
  process.exit(1);
}

console.log(`Asset validation passed in ${mode} mode for ${entries.length} entries.`);
