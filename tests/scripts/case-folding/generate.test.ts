import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateCaseFoldingSource } from "../../../scripts/case-folding/generate";

describe("generateCaseFoldingSource", () => {
  it("reproduces the checked-in Unicode case-folding module", async () => {
    const generated = generateCaseFoldingSource();
    const checkedInSource = await readFile(
      join(process.cwd(), "src/generated/unicode-case-folding.ts"),
      "utf8"
    );

    expect(generated.entries).toBe(1_585);
    expect(generated.byteLength).toBe(5_566);
    expect(generated.source).toBe(checkedInSource);
  });
});
