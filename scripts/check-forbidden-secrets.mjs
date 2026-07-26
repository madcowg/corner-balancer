import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const rootDir = process.cwd();
const forbiddenPatterns = [
  {
    description: "Google API key",
    regex: /AIza[0-9A-Za-z_-]{35}/g,
  },
];

const ignoredDirectories = new Set([
  ".git",
  ".firebase",
  "dist",
  "dist-alpha",
  "dist-pages",
  "dist-ssr",
  "node_modules",
]);

const allowedExtensions = new Set([
  "",
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

const findings = [];

function scanDirectory(dirPath) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      scanDirectory(join(dirPath, entry.name));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const filePath = join(dirPath, entry.name);
    const extension = extname(entry.name);
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    const stat = statSync(filePath);
    if (stat.size > 1024 * 1024) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    for (const { description, regex } of forbiddenPatterns) {
      const matches = Array.from(content.matchAll(regex));
      for (const match of matches) {
        const line = content.slice(0, match.index).split(/\r?\n/).length;
        findings.push({
          description,
          file: relative(rootDir, filePath),
          line,
          value: match[0],
        });
      }
    }
  }
}

scanDirectory(rootDir);

if (findings.length > 0) {
  console.error("Forbidden secret-like values found:");
  for (const finding of findings) {
    console.error(
      `- ${finding.description} in ${finding.file}:${finding.line} (${finding.value})`,
    );
  }

  process.exitCode = 1;
} else {
  console.log("Security scan passed: no forbidden Google API key patterns found.");
}
