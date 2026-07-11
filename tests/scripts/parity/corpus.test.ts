import { describe, expect, it } from "vitest";
import { loadCorpusFixtures } from "../../../scripts/parity/corpus";

describe("GitHub Markdown visual corpus", () => {
  it("covers all twelve repository fixtures as complete files", () => {
    const fixtures = loadCorpusFixtures();
    const files = new Set(fixtures.map(({ file }) => file));

    expect(files.size).toBe(12);
    expect([...files].sort()).toEqual(
      Array.from({ length: 12 }, (_value, index) => String(index + 1).padStart(2, "0"))
    );
    expect(fixtures).toHaveLength(12);
    expect(new Set(fixtures.map(({ id }) => id)).size).toBe(fixtures.length);
    expect(
      fixtures.every(({ markdown, path }) => markdown.trim().length > 0 && path.endsWith(".md"))
    ).toBe(true);
  });
});
