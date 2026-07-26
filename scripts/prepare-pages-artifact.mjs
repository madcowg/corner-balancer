import fs from "node:fs";
import path from "node:path";

const outputDirectory = process.argv[2];

if (!outputDirectory) {
  console.error("Expected an output directory argument, for example: node scripts/prepare-pages-artifact.mjs dist-pages");
  process.exit(1);
}

const projectRoot = process.cwd();
const resolvedOutputDirectory = path.resolve(projectRoot, outputDirectory);
const indexPath = path.join(resolvedOutputDirectory, "index.html");
const notFoundPath = path.join(resolvedOutputDirectory, "404.html");

if (!fs.existsSync(indexPath)) {
  console.error(`Cannot prepare GitHub Pages artifact because ${indexPath} does not exist.`);
  process.exit(1);
}

fs.copyFileSync(indexPath, notFoundPath);

console.log(`Prepared GitHub Pages artifact in ${outputDirectory}.`);
