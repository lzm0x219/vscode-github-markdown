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

export type PackageAuditReport = {
  conclusion: "pass" | "fail";
  baseline: PackageSnapshot;
  current: PackageSnapshot;
  archiveDeltaBytes: number;
  archiveDeltaRatio: number;
  largestEntryIncreases: PackageEntryIncrease[];
  violations: PackageAuditViolation[];
};

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

export function auditPackageComparison(
  baseline: PackageSnapshot,
  current: PackageSnapshot
): PackageAuditReport {
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
  const violations: PackageAuditViolation[] = [];
  if (current.archiveBytes > maximumPackageBytes) {
    violations.push({
      rule: "maximum-size",
      actual: current.archiveBytes,
      limit: maximumPackageBytes
    });
  }
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
  for (const path of Object.keys(current.entries).sort()) {
    if (path.startsWith("extension/.serena/") || forbiddenPackageFiles.has(path)) {
      violations.push({ rule: "forbidden-file", path });
    }
  }

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
