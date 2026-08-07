import { runPackageAudit } from "./cli";

const args = process.argv.slice(2);
const summaryPath = process.env["GITHUB_STEP_SUMMARY"];

if (args[0] === "--current-only") {
  const [, currentPath, outputPath, ...extra] = args;
  if (!currentPath || !outputPath || extra.length > 0) throw new Error(usage());
  await runPackageAudit({
    currentPath,
    outputPath,
    ...(summaryPath ? { summaryPath } : {})
  });
} else {
  const [baselinePath, currentPath, outputPath, ...extra] = args;
  if (!baselinePath || !currentPath || !outputPath || extra.length > 0) {
    throw new Error(usage());
  }
  await runPackageAudit({
    baselinePath,
    currentPath,
    outputPath,
    ...(summaryPath ? { summaryPath } : {})
  });
}

function usage(): string {
  return [
    "Usage:",
    "  nub scripts/package-audit/index.ts <baseline.vsix> <current.vsix> <report.json>",
    "  nub scripts/package-audit/index.ts --current-only <current.vsix> <report.json>"
  ].join("\n");
}
