import type { PackageAuditReport, PackageAuditViolation } from "./audit";

const numberFormat = new Intl.NumberFormat("en-US");

export function renderPackageAuditReport(report: PackageAuditReport): string {
  const lines = [
    "# VSIX package size",
    "",
    `Conclusion: **${report.conclusion.toUpperCase()}**`,
    "",
    "| Package | Size |",
    "| --- | ---: |",
    `| Baseline | ${formatBytes(report.baseline.archiveBytes)} |`,
    `| Current | ${formatBytes(report.current.archiveBytes)} |`,
    `| Change | ${formatSignedBytes(report.archiveDeltaBytes)} (${formatSignedPercent(report.archiveDeltaRatio)}) |`
  ];

  if (report.violations.length > 0) {
    lines.push(
      "",
      "## Violations",
      "",
      ...report.violations.map((violation) => `- ${renderViolation(violation)}`)
    );
  }

  lines.push("", "## Largest file increases", "", "| File | Baseline | Current | Change |");
  lines.push("| --- | ---: | ---: | ---: |");
  if (report.largestEntryIncreases.length === 0) {
    lines.push("| No file increases | — | — | — |");
  } else {
    for (const entry of report.largestEntryIncreases) {
      lines.push(
        `| \`${entry.path.replaceAll("|", "\\|")}\` | ${formatBytes(entry.baselineBytes)} | ${formatBytes(entry.currentBytes)} | ${formatSignedBytes(entry.deltaBytes)} |`
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

function renderViolation(violation: PackageAuditViolation): string {
  if (violation.rule === "forbidden-file") {
    return `Forbidden package file: \`${violation.path}\`.`;
  }
  if (violation.rule === "maximum-increase-ratio") {
    return `Package increase ${formatPercent(violation.actual)} exceeds ${formatPercent(violation.limit)}.`;
  }
  return `${violation.rule === "maximum-size" ? "Package size" : "Package increase"} ${formatBytes(violation.actual)} exceeds ${formatBytes(violation.limit)}.`;
}

function formatBytes(value: number): string {
  return `${numberFormat.format(value)} B`;
}

function formatSignedBytes(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatBytes(value)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatPercent(value)}`;
}
