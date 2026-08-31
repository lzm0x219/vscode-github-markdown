import { caseFold as referenceCaseFold } from "unicode-case-folding";
import { describe, expect, it } from "vitest";
import { caseFold } from "../../src/generated/unicode-case-folding";

describe("generated Unicode case folding", () => {
  it.each([
    ["", ""],
    ["STRASSE", "strasse"],
    ["Straße", "strasse"],
    ["Σςσ", "σσσ"],
    ["ﬃ", "ffi"],
    ["Ꭰꭰ", "ᎠᎠ"]
  ])("folds %j to %j", (input, expected) => {
    expect(caseFold(input)).toBe(expected);
  });

  it("matches the reference table for every Unicode scalar value", () => {
    const mismatches: string[] = [];
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint += 1) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
      const character = String.fromCodePoint(codePoint);
      if (caseFold(character) !== referenceCaseFold(character)) {
        mismatches.push(`U+${codePoint.toString(16).toUpperCase()}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
