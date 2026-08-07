import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  new URL("../../../.github/workflows/publish.yml", import.meta.url),
  "utf8"
);

describe("manual tag publishing", () => {
  it("ensures a draft GitHub Release exists before publishing to the Marketplace", () => {
    const prepareStart = workflow.indexOf("  prepare-release:");
    const publishStart = workflow.indexOf("  publish:");
    const marketplaceStart = workflow.indexOf("Publish to VS Code Marketplace");

    expect(prepareStart).toBeGreaterThan(-1);
    expect(prepareStart).toBeLessThan(publishStart);
    expect(prepareStart).toBeLessThan(marketplaceStart);

    const prepareJob = workflow.slice(prepareStart, publishStart);
    expect(prepareJob).toContain("needs: verify");
    expect(prepareJob).toContain("contents: write");
    expect(prepareJob).toContain('gh release view "$GITHUB_REF_NAME"');
    expect(prepareJob).toContain('gh release create "$GITHUB_REF_NAME"');
    expect(prepareJob).toContain("--draft");
    expect(prepareJob).toContain("--verify-tag");

    const publishJob = workflow.slice(publishStart, workflow.indexOf("  finalize:"));
    expect(publishJob).toContain("needs: prepare-release");
  });
});
