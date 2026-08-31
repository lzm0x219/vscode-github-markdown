import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("release changelog verification", () => {
  it("runs the release-note contract before changes can merge", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8")
    ) as { scripts?: Record<string, string> };
    const workflow = readFileSync(
      new URL("../../../.github/workflows/ci.yml", import.meta.url),
      "utf8"
    );

    expect(manifest.scripts?.["verify:release"]).toBe("nub scripts/release/verify-index.ts");
    expect(workflow).toContain("run: nub run verify:release");
  });
});
