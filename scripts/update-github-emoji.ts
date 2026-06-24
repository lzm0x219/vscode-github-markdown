import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const sourceUrl = "https://api.github.com/emojis";
const emojiDataUrl = "https://unicode.org/Public/17.0.0/ucd/emoji/emoji-data.txt";
const emojiVariationSequencesUrl =
  "https://unicode.org/Public/17.0.0/ucd/emoji/emoji-variation-sequences.txt";
const outputPath = "src/generated/github-emojis.ts";

const data = await fetchText(sourceUrl, {
  Accept: "application/vnd.github+json",
  "User-Agent": "vscode-github-markdown"
}).then(JSON.parse);
if (!isEmojiMap(data)) {
  throw new TypeError("GitHub emoji response must be an object of alias-to-url strings");
}

const [emojiStyleCodepoints, defaultEmojiPresentationCodepoints] = await Promise.all([
  fetchEmojiStyleCodepoints(),
  fetchEmojiDataCodepoints("Emoji_Presentation")
]);
const entries = Object.entries(data).sort(([left], [right]) => left.localeCompare(right));
const unicodeEntries: [string, string][] = [];
const imageEntries: [string, string][] = [];

for (const [name, url] of entries) {
  const unicodeEmoji = unicodeFromGitHubUrl(
    url,
    emojiStyleCodepoints,
    defaultEmojiPresentationCodepoints
  );
  if (unicodeEmoji) {
    unicodeEntries.push([name, unicodeEmoji]);
    continue;
  }

  imageEntries.push([name, url]);
}

const generated =
  `// Generated from ${sourceUrl}. Run \`nub scripts/update-github-emoji.ts\` to refresh.\n` +
  `${formatConstMap("githubUnicodeEmojiByAlias", unicodeEntries)}\n\n` +
  `${formatConstMap("githubImageEmojiByAlias", imageEntries)}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, generated, "utf8");

console.log(
  `Wrote ${unicodeEntries.length} Unicode emoji aliases and ${imageEntries.length} image emoji aliases to ${outputPath}`
);

async function fetchText(url: string, headers?: Record<string, string>): Promise<string> {
  const response = await fetch(url, { headers: new Headers(headers) });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function isEmojiMap(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([name, url]) => typeof name === "string" && typeof url === "string"
  );
}

function formatConstMap(name: string, entries: [string, string][]): string {
  const body = entries
    .map(([alias, value]) => `  ${JSON.stringify(alias)}: ${JSON.stringify(value)}`)
    .join(",\n");

  return `export const ${name} = {\n${body}\n} as const;`;
}

async function fetchEmojiStyleCodepoints(): Promise<Set<number>> {
  const text = await fetchText(emojiVariationSequencesUrl);
  const codepoints = new Set<number>();

  for (const line of text.split("\n")) {
    const dataLine = line.split("#")[0]?.trim();
    if (!dataLine) {
      continue;
    }

    const [sequence, style] = dataLine.split(";").map((part) => part.trim());
    const sequenceCodepoints = sequence
      ?.split(/\s+/)
      .map((codepoint) => Number.parseInt(codepoint, 16));
    if (style === "emoji style" && sequenceCodepoints?.[1] === 0xfe0f) {
      codepoints.add(sequenceCodepoints[0] ?? 0);
    }
  }

  return codepoints;
}

async function fetchEmojiDataCodepoints(property: string): Promise<Set<number>> {
  const text = await fetchText(emojiDataUrl);
  const codepoints = new Set<number>();

  for (const line of text.split("\n")) {
    const dataLine = line.split("#")[0]?.trim();
    if (!dataLine) {
      continue;
    }

    const [range, lineProperty] = dataLine.split(";").map((part) => part.trim());
    if (lineProperty !== property || !range) {
      continue;
    }

    const [start, end = start] = range
      .split("..")
      .map((codepoint) => Number.parseInt(codepoint, 16));
    if (!start || !end) {
      continue;
    }

    for (let codepoint = start; codepoint <= end; codepoint += 1) {
      codepoints.add(codepoint);
    }
  }

  return codepoints;
}

function unicodeFromGitHubUrl(
  url: string,
  emojiStyleCodepoints: ReadonlySet<number>,
  defaultEmojiPresentationCodepoints: ReadonlySet<number>
): string | undefined {
  const match = url.match(/\/unicode\/([0-9a-f-]+)\.png/i);
  const codepoints = match?.[1]?.split("-").map((codepoint) => Number.parseInt(codepoint, 16));
  if (!codepoints) {
    return undefined;
  }

  if (!canRenderAsUnicode(codepoints)) {
    return undefined;
  }

  return String.fromCodePoint(
    ...applyEmojiPresentation(codepoints, emojiStyleCodepoints, defaultEmojiPresentationCodepoints)
  );
}

function applyEmojiPresentation(
  codepoints: number[],
  emojiStyleCodepoints: ReadonlySet<number>,
  defaultEmojiPresentationCodepoints: ReadonlySet<number>
): number[] {
  const first = codepoints[0];
  if (!first || defaultEmojiPresentationCodepoints.has(first) || !emojiStyleCodepoints.has(first)) {
    return codepoints;
  }

  if (
    codepoints.length === 1 ||
    codepoints.at(-1) === 0x20e3 ||
    (codepoints.length === 2 && isSkinTone(codepoints[1] ?? 0))
  ) {
    return [first, 0xfe0f, ...codepoints.slice(1)];
  }

  return codepoints;
}

function canRenderAsUnicode(codepoints: number[]): boolean {
  if (codepoints.length === 1 || codepoints.includes(0x200d)) {
    return true;
  }

  if (codepoints.every(isRegionalIndicator)) {
    return true;
  }

  if (codepoints[0] === 0x1f3f4 && codepoints.slice(1).every(isTagCodepoint)) {
    return true;
  }

  if (codepoints.at(-1) === 0x20e3) {
    return true;
  }

  if (
    codepoints.length === 2 &&
    (isSkinTone(codepoints[1] ?? 0) || isVariationSelector(codepoints[1] ?? 0))
  ) {
    return true;
  }

  return false;
}

function isRegionalIndicator(codepoint: number): boolean {
  return codepoint >= 0x1f1e6 && codepoint <= 0x1f1ff;
}

function isTagCodepoint(codepoint: number): boolean {
  return codepoint >= 0xe0061 && codepoint <= 0xe007f;
}

function isSkinTone(codepoint: number): boolean {
  return codepoint >= 0x1f3fb && codepoint <= 0x1f3ff;
}

function isVariationSelector(codepoint: number): boolean {
  return codepoint === 0xfe0e || codepoint === 0xfe0f;
}
