import type MarkdownIt from "markdown-it";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import type { Delimiter } from "markdown-it/lib/rules_inline/state_inline.mjs";

const tildeCharacter = 0x7e;
const singleTildeDelimiter = 0x1007e;
const doubleTildeDelimiter = 0x2007e;

export default function markdownItGitHubStrikethrough(md: MarkdownIt): MarkdownIt {
  md.inline.ruler.at("strikethrough", tokenizeStrikethrough);
  md.inline.ruler2.at("strikethrough", postProcessStrikethrough);
  return md;
}

function tokenizeStrikethrough(state: StateInline, silent: boolean): boolean {
  if (silent || state.src.charCodeAt(state.pos) !== tildeCharacter) {
    return false;
  }

  const scanned = state.scanDelims(state.pos, true);
  const token = state.push("text", "", 0);
  token.content = "~".repeat(scanned.length);
  state.pos += scanned.length;

  if (scanned.length > 2) {
    return true;
  }

  state.delimiters.push({
    marker: scanned.length === 1 ? singleTildeDelimiter : doubleTildeDelimiter,
    length: 0,
    token: state.tokens.length - 1,
    end: -1,
    open: scanned.can_open,
    close: scanned.can_close
  });
  return true;
}

function postProcessStrikethrough(state: StateInline): boolean {
  applyStrikethroughTokens(state, state.delimiters);

  for (const metadata of state.tokens_meta) {
    if (metadata) {
      applyStrikethroughTokens(state, metadata.delimiters);
    }
  }

  return true;
}

function applyStrikethroughTokens(state: StateInline, delimiters: Delimiter[]): void {
  for (const opening of delimiters) {
    if (!isStrikethroughDelimiter(opening.marker) || opening.end < 0) {
      continue;
    }

    const closing = delimiters[opening.end];
    if (!closing) {
      continue;
    }

    const isSingleTilde = opening.marker === singleTildeDelimiter;
    const markup = isSingleTilde ? "~" : "~~";
    const tag = isSingleTilde ? "del" : "s";
    const openingToken = state.tokens[opening.token];
    const closingToken = state.tokens[closing.token];
    if (!openingToken || !closingToken) {
      continue;
    }

    openingToken.type = `${tag}_open`;
    openingToken.tag = tag;
    openingToken.nesting = 1;
    openingToken.markup = markup;
    openingToken.content = "";

    closingToken.type = `${tag}_close`;
    closingToken.tag = tag;
    closingToken.nesting = -1;
    closingToken.markup = markup;
    closingToken.content = "";
  }
}

function isStrikethroughDelimiter(marker: number): boolean {
  return marker === singleTildeDelimiter || marker === doubleTildeDelimiter;
}
