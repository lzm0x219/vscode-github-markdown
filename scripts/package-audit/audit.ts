export type PackageSnapshot = {
  archiveBytes: number;
  entries: Readonly<Record<string, number>>;
};

export type PackageEntryIncrease = {
  path: string;
  baselineBytes: number;
  currentBytes: number;
  deltaBytes: number;
};

type PackageAuditReportBase = {
  conclusion: "pass" | "fail";
  current: PackageSnapshot;
  violations: PackageAuditViolation[];
};

export type PackageComparisonAuditReport = PackageAuditReportBase & {
  baseline: PackageSnapshot;
  archiveDeltaBytes: number;
  archiveDeltaRatio: number;
  largestEntryIncreases: PackageEntryIncrease[];
};

export type CurrentPackageAuditReport = PackageAuditReportBase & {
  mode: "current-only";
};

export type PackageAuditReport = PackageComparisonAuditReport | CurrentPackageAuditReport;

export type PackageAuditViolation =
  | {
      rule: "maximum-size" | "maximum-increase-bytes" | "maximum-increase-ratio";
      actual: number;
      limit: number;
    }
  | { rule: "forbidden-file"; path: string };

export const maximumPackageBytes = 512 * 1024;
export const maximumPackageIncreaseBytes = 64 * 1024;
export const maximumPackageIncreaseRatio = 0.2;
const forbiddenPackageFiles = new Set([
  "extension/assets/parity-github.png",
  "extension/assets/parity-vscode.png",
  "extension/assets/readme-banner-dark.jpg",
  "extension/assets/readme-banner.jpg",
  "extension/release-CHANGELOG.txt"
]);
const forbiddenPackagePathPrefixes = ["extension/.playwright-cli/", "extension/.serena/"];

export function auditPackageComparison(
  baseline: PackageSnapshot,
  current: PackageSnapshot
): PackageComparisonAuditReport {
  const archiveDeltaBytes = current.archiveBytes - baseline.archiveBytes;
  const archiveDeltaRatio =
    baseline.archiveBytes === 0 ? 0 : archiveDeltaBytes / baseline.archiveBytes;
  const largestEntryIncreases = Object.entries(current.entries)
    .map(([path, currentBytes]) => {
      const baselineBytes = baseline.entries[path] ?? 0;
      return { path, baselineBytes, currentBytes, deltaBytes: currentBytes - baselineBytes };
    })
    .filter(({ deltaBytes }) => deltaBytes > 0)
    .sort(
      (left, right) => right.deltaBytes - left.deltaBytes || left.path.localeCompare(right.path)
    )
    .slice(0, 10);
  const violations = auditMaximumPackageSize(current);
  if (archiveDeltaBytes > maximumPackageIncreaseBytes) {
    violations.push({
      rule: "maximum-increase-bytes",
      actual: archiveDeltaBytes,
      limit: maximumPackageIncreaseBytes
    });
  }
  if (archiveDeltaRatio > maximumPackageIncreaseRatio) {
    violations.push({
      rule: "maximum-increase-ratio",
      actual: archiveDeltaRatio,
      limit: maximumPackageIncreaseRatio
    });
  }
  violations.push(...auditForbiddenPackageFiles(current));
  return {
    conclusion: violations.length === 0 ? "pass" : "fail",
    baseline,
    current,
    archiveDeltaBytes,
    archiveDeltaRatio,
    largestEntryIncreases,
    violations
  };
}

export function auditCurrentPackage(current: PackageSnapshot): CurrentPackageAuditReport {
  const violations = auditCurrentPackageViolations(current);
  return {
    mode: "current-only",
    conclusion: violations.length === 0 ? "pass" : "fail",
    current,
    violations
  };
}

function auditCurrentPackageViolations(current: PackageSnapshot): PackageAuditViolation[] {
  return [...auditMaximumPackageSize(current), ...auditForbiddenPackageFiles(current)];
}

function auditMaximumPackageSize(current: PackageSnapshot): PackageAuditViolation[] {
  if (current.archiveBytes > maximumPackageBytes) {
    return [{ rule: "maximum-size", actual: current.archiveBytes, limit: maximumPackageBytes }];
  }
  return [];
}

function auditForbiddenPackageFiles(current: PackageSnapshot): PackageAuditViolation[] {
  const violations: PackageAuditViolation[] = [];
  for (const path of Object.keys(current.entries).sort()) {
    if (
      forbiddenPackagePathPrefixes.some((prefix) => path.startsWith(prefix)) ||
      forbiddenPackageFiles.has(path)
    ) {
      violations.push({ rule: "forbidden-file", path });
    }
  }
  return violations;
}
