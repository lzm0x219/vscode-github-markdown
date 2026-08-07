import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  new URL("../../../.github/workflows/publish.yml", import.meta.url),
  "utf8"
);

describe("publish package audit", () => {
  it("compares the release VSIX with the previous published stable release", () => {
    expect(workflow).toContain("Download previous published VSIX baseline");
    expect(workflow).toContain("--exclude-drafts");
    expect(workflow).toContain("--exclude-pre-releases");
    expect(workflow).toContain("select(.tagName != $current)");
    expect(workflow).toContain('gh release download "$baseline_tag"');

    const auditStep = workflow.slice(workflow.indexOf("Verify VSIX contents and size"));
    expect(auditStep).toContain('"$baseline" \\\n');
    expect(auditStep).toContain('"$archive" \\\n');
    expect(auditStep).not.toContain('"$archive" \\\n            "$archive"');
  });
});
