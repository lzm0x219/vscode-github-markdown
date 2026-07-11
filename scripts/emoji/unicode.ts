export type EmojiPresentation = {
  emojiStyleBases: ReadonlySet<number>;
  defaultEmojiBases: ReadonlySet<number>;
};

export function parseUnicodeProperty(text: string, property: string): ReadonlySet<number> {
  const result = new Set<number>();

  for (const line of dataLines(text)) {
    const [range, lineProperty] = fields(line);
    if (lineProperty !== property || !range) continue;

    const [startText, endText = startText] = range.split("..");
    const start = parseHex(startText);
    const end = parseHex(endText);
    if (start === undefined || end === undefined || start > end) continue;

    for (let codepoint = start; codepoint <= end; codepoint += 1) result.add(codepoint);
  }

  return result;
}

export function parseEmojiVariationBases(text: string): ReadonlySet<number> {
  const result = new Set<number>();

  for (const line of dataLines(text)) {
    const [sequence, style] = fields(line);
    if (style !== "emoji style" || !sequence) continue;

    const [baseText, selectorText] = sequence.split(/\s+/);
    const base = parseHex(baseText);
    const selector = parseHex(selectorText);
    if (base !== undefined && selector === 0xfe0f) result.add(base);
  }

  return result;
}

export function emojiFromGitHubUrl(
  url: string,
  presentation: EmojiPresentation
): string | undefined {
  const encoded = /\/unicode\/([0-9a-f-]+)\.png/i.exec(url)?.[1];
  if (!encoded) return undefined;

  const codepoints = encoded.split("-").map(parseHex);
  if (codepoints.some((codepoint) => codepoint === undefined)) return undefined;

  const sequence = codepoints as number[];
  if (!isRenderableSequence(sequence)) return undefined;

  return String.fromCodePoint(...withEmojiPresentation(sequence, presentation));
}

function dataLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.split("#", 1)[0]?.trim() ?? "")
    .filter(Boolean);
}

function fields(line: string): string[] {
  return line.split(";").map((part) => part.trim());
}

function parseHex(value: string | undefined): number | undefined {
  if (!value || !/^[0-9a-f]+$/i.test(value)) return undefined;
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) && parsed <= 0x10ffff ? parsed : undefined;
}

function withEmojiPresentation(
  codepoints: readonly number[],
  presentation: EmojiPresentation
): readonly number[] {
  const first = codepoints[0];
  if (
    first === undefined ||
    presentation.defaultEmojiBases.has(first) ||
    !presentation.emojiStyleBases.has(first)
  ) {
    return codepoints;
  }

  const requiresSelector =
    codepoints.length === 1 ||
    codepoints.at(-1) === 0x20e3 ||
    (codepoints.length === 2 && isSkinTone(codepoints[1]));
  return requiresSelector ? [first, 0xfe0f, ...codepoints.slice(1)] : codepoints;
}

function isRenderableSequence(codepoints: readonly number[]): boolean {
  return (
    codepoints.length === 1 ||
    codepoints.includes(0x200d) ||
    codepoints.every(isRegionalIndicator) ||
    (codepoints[0] === 0x1f3f4 && codepoints.slice(1).every(isTagCodepoint)) ||
    codepoints.at(-1) === 0x20e3 ||
    (codepoints.length === 2 && (isSkinTone(codepoints[1]) || isVariationSelector(codepoints[1])))
  );
}

function isRegionalIndicator(codepoint: number | undefined): boolean {
  return codepoint !== undefined && codepoint >= 0x1f1e6 && codepoint <= 0x1f1ff;
}

function isTagCodepoint(codepoint: number | undefined): boolean {
  return codepoint !== undefined && codepoint >= 0xe0061 && codepoint <= 0xe007f;
}

function isSkinTone(codepoint: number | undefined): boolean {
  return codepoint !== undefined && codepoint >= 0x1f3fb && codepoint <= 0x1f3ff;
}

function isVariationSelector(codepoint: number | undefined): boolean {
  return codepoint === 0xfe0e || codepoint === 0xfe0f;
}
