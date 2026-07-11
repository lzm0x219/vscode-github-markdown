import { describe, expect, it } from "vitest";
import {
  assertCompleteEmojiSources,
  createEmojiCatalog,
  renderEmojiModule
} from "../../../scripts/emoji/generate";

const presentation = {
  emojiStyleBases: new Set([0x23]),
  defaultEmojiBases: new Set([0x1f680])
};

describe("createEmojiCatalog", () => {
  it("sorts aliases and separates Unicode from image emoji", () => {
    const catalog = createEmojiCatalog({
      emojiUrls: {
        rocket: "https://github.githubassets.com/images/icons/emoji/unicode/1f680.png?v8",
        artist: "https://github.githubassets.com/images/icons/emoji/artist.png?v8",
        hash: "https://github.githubassets.com/images/icons/emoji/unicode/23-20e3.png?v8"
      },
      presentation
    });

    expect(catalog.unicode).toEqual([
      ["hash", "#️⃣"],
      ["rocket", "🚀"]
    ]);
    expect(catalog.images).toEqual([
      ["artist", "https://github.githubassets.com/images/icons/emoji/artist.png?v8"]
    ]);
  });
});

describe("assertCompleteEmojiSources", () => {
  it.each([
    ["GitHub emoji aliases", {}, new Set(range(1_000)), new Set(range(100))],
    ["default emoji presentation", stringMap(1_000), new Set<number>(), new Set(range(100))],
    ["emoji variation bases", stringMap(1_000), new Set(range(1_000)), new Set<number>()]
  ])("rejects incomplete %s data", (_source, emojiUrls, defaultEmojiBases, emojiStyleBases) => {
    expect(() =>
      assertCompleteEmojiSources({
        emojiUrls,
        presentation: { defaultEmojiBases, emojiStyleBases }
      })
    ).toThrow("Emoji source data is incomplete");
  });

  it("accepts source data above the safety thresholds", () => {
    expect(() =>
      assertCompleteEmojiSources({
        emojiUrls: stringMap(1_000),
        presentation: {
          defaultEmojiBases: new Set(range(1_000)),
          emojiStyleBases: new Set(range(100))
        }
      })
    ).not.toThrow();
  });
});

describe("renderEmojiModule", () => {
  it("renders stable TypeScript with the update command", () => {
    const output = renderEmojiModule(
      { unicode: [["rocket", "🚀"]], images: [["artist", "https://example.com/artist.png"]] },
      "https://api.github.com/emojis"
    );

    expect(output)
      .toBe(`// Generated from https://api.github.com/emojis. Run \`nub run update:emoji\` to refresh.
export const githubUnicodeEmojiByAlias = {
  rocket: "🚀"
} as const;

export const githubImageEmojiByAlias = {
  artist: "https://example.com/artist.png"
} as const;
`);
  });

  it("wraps generated properties at the project print width", () => {
    const output = renderEmojiModule(
      {
        unicode: [],
        images: [
          [
            "construction_worker_woman",
            "https://github.githubassets.com/images/icons/emoji/unicode/1f477-2640.png?v8"
          ]
        ]
      },
      "https://api.github.com/emojis"
    );

    expect(output).toContain(`  construction_worker_woman:
    "https://github.githubassets.com/images/icons/emoji/unicode/1f477-2640.png?v8"`);
  });
});

function range(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function stringMap(length: number): Record<string, string> {
  return Object.fromEntries(
    range(length).map((index) => [`emoji-${index}`, `https://example.com/${index}`])
  );
}
