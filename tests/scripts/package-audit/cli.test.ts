import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { PackageSnapshot } from "../../../scripts/package-audit/audit";
import { PackageAuditError, runPackageAudit } from "../../../scripts/package-audit/cli";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("runPackageAudit", () => {
  it("writes JSON and Markdown reports for a passing comparison", async () => {
    const directory = await mkdtemp(join(tmpdir(), "package-audit-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, "report.json");
    const summaryPath = join(directory, "summary.md");
    const snapshots: Record<string, PackageSnapshot> = {
      baseline: { archiveBytes: 200_000, entries: {} },
      current: { archiveBytes: 210_000, entries: {} }
    };

    await runPackageAudit({
      baselinePath: "baseline",
      currentPath: "current",
      outputPath,
      summaryPath,
      readSnapshot: async (path) => snapshots[path]!
    });

    expect(JSON.parse(await readFile(outputPath, "utf8"))).toMatchObject({
      conclusion: "pass",
      archiveDeltaBytes: 10_000
    });
    expect(await readFile(summaryPath, "utf8")).toContain("Conclusion: **PASS**");
  });

  it("writes the reports before failing a blocked comparison", async () => {
    const directory = await mkdtemp(join(tmpdir(), "package-audit-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, "report.json");
    const summaryPath = join(directory, "summary.md");

    await expect(
      runPackageAudit({
        baselinePath: "baseline",
        currentPath: "current",
        outputPath,
        summaryPath,
        readSnapshot: async (path) =>
          path === "baseline"
            ? { archiveBytes: 200_000, entries: {} }
            : { archiveBytes: 600_000, entries: {} }
      })
    ).rejects.toBeInstanceOf(PackageAuditError);

    expect(JSON.parse(await readFile(outputPath, "utf8"))).toMatchObject({
      conclusion: "fail"
    });
    expect(await readFile(summaryPath, "utf8")).toContain("Conclusion: **FAIL**");
  });
});
