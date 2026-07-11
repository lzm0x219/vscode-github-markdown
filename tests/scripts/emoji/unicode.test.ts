import { describe, expect, it } from "vitest";
import {
  emojiFromGitHubUrl,
  parseEmojiVariationBases,
  parseUnicodeProperty
} from "../../../scripts/emoji/unicode";

describe("Unicode emoji data", () => {
  it("parses matching codepoints and ranges", () => {
    const text = [
      "231A..231B ; Emoji_Presentation # watches",
      "2600 ; Emoji # sun",
      "1F680 ; Emoji_Presentation # rocket"
    ].join("\n");

    expect([...parseUnicodeProperty(text, "Emoji_Presentation")]).toEqual([
      0x231a, 0x231b, 0x1f680
    ]);
  });

  it("ignores malformed Unicode property lines", () => {
    const text = "invalid ; Emoji_Presentation\n1234..nope ; Emoji_Presentation\n";
    expect([...parseUnicodeProperty(text, "Emoji_Presentation")]).toEqual([]);
  });

  it("parses bases with an emoji-style variation", () => {
    const text = [
      "0023 FE0F ; emoji style; # NUMBER SIGN",
      "002A FE0E ; text style; # ASTERISK",
      "invalid FE0F ; emoji style; # malformed"
    ].join("\n");
    expect([...parseEmojiVariationBases(text)]).toEqual([0x23]);
  });
});

describe("emojiFromGitHubUrl", () => {
  const presentation = {
    emojiStyleBases: new Set([0x23, 0x2600]),
    defaultEmojiBases: new Set([0x1f680])
  };

  it.each([
    ["single default emoji", "1f680", "🚀"],
    ["explicit emoji presentation", "2600", "☀️"],
    ["keycap", "23-20e3", "#️⃣"],
    ["regional flag", "1f1e8-1f1f3", "🇨🇳"],
    ["skin tone", "1f44d-1f3fd", "👍🏽"],
    ["ZWJ sequence", "1f469-200d-1f4bb", "👩‍💻"],
    ["tag sequence", "1f3f4-e0067-e0062-e007f", "🏴\u{e0067}\u{e0062}\u{e007f}"]
  ])("renders a %s", (_case, codepoints, expected) => {
    expect(
      emojiFromGitHubUrl(
        `https://github.githubassets.com/images/icons/emoji/unicode/${codepoints}.png?v8`,
        presentation
      )
    ).toBe(expected);
  });

  it.each([
    "https://github.githubassets.com/images/icons/emoji/shipit.png?v8",
    "https://github.githubassets.com/images/icons/emoji/unicode/not-hex.png?v8",
    "https://github.githubassets.com/images/icons/emoji/unicode/1234-5678.png?v8"
  ])("does not render unsupported URLs", (url) => {
    expect(emojiFromGitHubUrl(url, presentation)).toBeUndefined();
  });
});
