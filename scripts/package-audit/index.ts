import { runPackageAudit } from "./cli";

const [baselinePath, currentPath, outputPath] = process.argv.slice(2);
if (!baselinePath || !currentPath || !outputPath) {
  throw new Error(
    "Usage: nub scripts/package-audit/index.ts <baseline.vsix> <current.vsix> <report.json>"
  );
}

await runPackageAudit({
  baselinePath,
  currentPath,
  outputPath,
  ...(process.env["GITHUB_STEP_SUMMARY"] ? { summaryPath: process.env["GITHUB_STEP_SUMMARY"] } : {})
});
