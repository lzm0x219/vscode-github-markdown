import { describe, expect, it } from "vitest";
import { auditPackageComparison } from "../../../scripts/package-audit/audit";

describe("auditPackageComparison", () => {
  it("passes a small package increase and reports its exact delta", () => {
    const report = auditPackageComparison(
      {
        archiveBytes: 200_000,
        entries: {
          "extension/dist/extension.js": 100_000,
          "extension/readme.md": 10_000
        }
      },
      {
        archiveBytes: 210_000,
        entries: {
          "extension/dist/extension.js": 105_000,
          "extension/readme.md": 10_000
        }
      }
    );

    expect(report.conclusion).toBe("pass");
    expect(report.archiveDeltaBytes).toBe(10_000);
    expect(report.archiveDeltaRatio).toBe(0.05);
    expect(report.largestEntryIncreases[0]).toEqual({
      path: "extension/dist/extension.js",
      baselineBytes: 100_000,
      currentBytes: 105_000,
      deltaBytes: 5_000
    });
  });

  it("fails when the current package exceeds 512 KiB", () => {
    const report = auditPackageComparison(
      { archiveBytes: 500_000, entries: {} },
      { archiveBytes: 524_289, entries: {} }
    );

    expect(report.conclusion).toBe("fail");
    expect(report.violations).toContainEqual({
      rule: "maximum-size",
      actual: 524_289,
      limit: 524_288
    });
  });

  it("fails when package growth exceeds 64 KiB", () => {
    const report = auditPackageComparison(
      { archiveBytes: 400_000, entries: {} },
      { archiveBytes: 465_537, entries: {} }
    );

    expect(report.violations).toContainEqual({
      rule: "maximum-increase-bytes",
      actual: 65_537,
      limit: 65_536
    });
  });

  it("fails when package growth exceeds 20 percent", () => {
    const report = auditPackageComparison(
      { archiveBytes: 100_000, entries: {} },
      { archiveBytes: 120_001, entries: {} }
    );

    expect(report.violations).toContainEqual({
      rule: "maximum-increase-ratio",
      actual: 0.20001,
      limit: 0.2
    });
  });

  it("fails when the current package contains forbidden files", () => {
    const report = auditPackageComparison(
      { archiveBytes: 200_000, entries: {} },
      {
        archiveBytes: 200_000,
        entries: {
          "extension/.playwright-cli/console.log": 143,
          "extension/.serena/project.yml": 9_375,
          "extension/assets/parity-github.png": 9_879,
          "extension/assets/readme-banner.jpg": 79_611,
          "extension/release-CHANGELOG.txt": 526
        }
      }
    );

    expect(report.violations).toEqual([
      { rule: "forbidden-file", path: "extension/.playwright-cli/console.log" },
      { rule: "forbidden-file", path: "extension/.serena/project.yml" },
      { rule: "forbidden-file", path: "extension/assets/parity-github.png" },
      { rule: "forbidden-file", path: "extension/assets/readme-banner.jpg" },
      { rule: "forbidden-file", path: "extension/release-CHANGELOG.txt" }
    ]);
  });
});
