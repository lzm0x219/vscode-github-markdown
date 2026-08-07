import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { readPackageSnapshot } from "./archive";
import {
  auditCurrentPackage,
  auditPackageComparison,
  type PackageAuditReport,
  type PackageSnapshot
} from "./audit";
import { renderPackageAuditReport } from "./report";

type PackageAuditOptions = {
  baselinePath?: string;
  currentPath: string;
  outputPath: string;
  summaryPath?: string;
  readSnapshot?: (path: string) => Promise<PackageSnapshot>;
};

export class PackageAuditError extends Error {
  constructor() {
    super("VSIX package audit failed");
    this.name = "PackageAuditError";
  }
}

export async function runPackageAudit(options: PackageAuditOptions): Promise<void> {
  const readSnapshot = options.readSnapshot ?? readPackageSnapshot;
  let report: PackageAuditReport;
  if (options.baselinePath) {
    const [baseline, current] = await Promise.all([
      readSnapshot(options.baselinePath),
      readSnapshot(options.currentPath)
    ]);
    report = auditPackageComparison(baseline, current);
  } else {
    report = auditCurrentPackage(await readSnapshot(options.currentPath));
  }
  const markdown = renderPackageAuditReport(report);

  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(
    options.outputPath,
    `${JSON.stringify({ schemaVersion: 1, ...report }, null, 2)}\n`
  );
  if (options.summaryPath) await appendFile(options.summaryPath, markdown);
  console.log(markdown);

  if (report.conclusion === "fail") throw new PackageAuditError();
}
