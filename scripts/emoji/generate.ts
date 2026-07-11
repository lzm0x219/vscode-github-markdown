import { emojiFromGitHubUrl, type EmojiPresentation } from "./unicode";

export type EmojiEntry = readonly [alias: string, value: string];

export type EmojiCatalog = {
  unicode: readonly EmojiEntry[];
  images: readonly EmojiEntry[];
};

export type EmojiCatalogInput = {
  emojiUrls: Readonly<Record<string, string>>;
  presentation: EmojiPresentation;
};

const minimumSourceSizes = {
  aliases: 1_000,
  defaultEmojiBases: 1_000,
  emojiStyleBases: 100
} as const;

export function assertCompleteEmojiSources(input: EmojiCatalogInput): void {
  const sizes = {
    aliases: Object.keys(input.emojiUrls).length,
    defaultEmojiBases: input.presentation.defaultEmojiBases.size,
    emojiStyleBases: input.presentation.emojiStyleBases.size
  };
  if (
    sizes.aliases < minimumSourceSizes.aliases ||
    sizes.defaultEmojiBases < minimumSourceSizes.defaultEmojiBases ||
    sizes.emojiStyleBases < minimumSourceSizes.emojiStyleBases
  ) {
    throw new Error(
      `Emoji source data is incomplete: aliases=${sizes.aliases}, defaultEmojiBases=${sizes.defaultEmojiBases}, emojiStyleBases=${sizes.emojiStyleBases}`
    );
  }
}

export function createEmojiCatalog(input: EmojiCatalogInput): EmojiCatalog {
  const unicode: EmojiEntry[] = [];
  const images: EmojiEntry[] = [];
  const entries = Object.entries(input.emojiUrls).sort(([left], [right]) =>
    left.localeCompare(right)
  );

  for (const [alias, url] of entries) {
    const emoji = emojiFromGitHubUrl(url, input.presentation);
    if (emoji === undefined) {
      images.push([alias, url]);
    } else {
      unicode.push([alias, emoji]);
    }
  }

  return { unicode, images };
}

export function renderEmojiModule(catalog: EmojiCatalog, sourceUrl: string): string {
  const header = `// Generated from ${sourceUrl}. Run \`nub run update:emoji\` to refresh.`;
  const unicode = renderMap("githubUnicodeEmojiByAlias", catalog.unicode);
  const images = renderMap("githubImageEmojiByAlias", catalog.images);
  return `${header}\n${unicode}\n\n${images}\n`;
}

function renderMap(name: string, entries: readonly EmojiEntry[]): string {
  const properties = entries
    .map(([alias, value], index) => renderProperty(alias, value, index < entries.length - 1))
    .join("\n");
  return `export const ${name} = {\n${properties}\n} as const;`;
}

function renderProperty(name: string, value: string, hasComma: boolean): string {
  const property = renderPropertyName(name);
  const serialized = JSON.stringify(value);
  const suffix = hasComma ? "," : "";
  const inline = `  ${property}: ${serialized}${suffix}`;
  return inline.length <= 100 ? inline : `  ${property}:\n    ${serialized}${suffix}`;
}

function renderPropertyName(name: string): string {
  return /^[$A-Z_a-z][$\w]*$/.test(name) ? name : JSON.stringify(name);
}
