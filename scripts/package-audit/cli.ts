import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { readPackageSnapshot } from "./archive";
import { auditPackageComparison, type PackageSnapshot } from "./audit";
import { renderPackageAuditReport } from "./report";

type PackageAuditOptions = {
  baselinePath: string;
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
  const [baseline, current] = await Promise.all([
    readSnapshot(options.baselinePath),
    readSnapshot(options.currentPath)
  ]);
  const report = auditPackageComparison(baseline, current);
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
