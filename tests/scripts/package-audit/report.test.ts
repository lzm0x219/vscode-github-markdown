import { describe, expect, it } from "vitest";
import { auditPackageComparison } from "../../../scripts/package-audit/audit";
import { renderPackageAuditReport } from "../../../scripts/package-audit/report";

describe("renderPackageAuditReport", () => {
  it("renders the package comparison and largest file increases for the job summary", () => {
    const report = auditPackageComparison(
      {
        archiveBytes: 200_000,
        entries: { "extension/dist/extension.js": 100_000 }
      },
      {
        archiveBytes: 210_000,
        entries: { "extension/dist/extension.js": 105_000 }
      }
    );

    const markdown = renderPackageAuditReport(report);

    expect(markdown).toContain("# VSIX package size");
    expect(markdown).toContain("| Baseline | 200,000 B |");
    expect(markdown).toContain("| Current | 210,000 B |");
    expect(markdown).toContain("| Change | +10,000 B (+5.00%) |");
    expect(markdown).toContain(
      "| `extension/dist/extension.js` | 100,000 B | 105,000 B | +5,000 B |"
    );
  });
});
