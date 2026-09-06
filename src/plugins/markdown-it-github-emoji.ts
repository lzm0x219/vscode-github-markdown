import type MarkdownIt from "markdown-it";
import type { MarkdownToken, MarkdownState } from "./shared";
import { githubImageEmojiByAlias, githubUnicodeEmojiByAlias } from "../generated/github-emojis";

const shortcodePattern = /:([+\-\w]+):/g;
const EMOJI_IMAGE_SIZE = "20";
const wrappedUnicodeEmojiAliases = new Set(["warning"]);

export default function markdownItGitHubEmoji(md: MarkdownIt): MarkdownIt {
  md.core.ruler.after("linkify", "github-markdown-emoji", (state) => {
    applyEmojiShortcodes(state as unknown as MarkdownState, md);
  });

  return md;
}

function applyEmojiShortcodes(state: MarkdownState, md: MarkdownIt) {
  let htmlCodeDepth = 0;
  for (const token of state.tokens) {
    if (token.type === "html_block") {
      htmlCodeDepth = codeDepthAfterHtml(token.content, htmlCodeDepth);
      continue;
    }
    if (token.type !== "inline" || !token.children) {
      continue;
    }

    const nextChildren: MarkdownToken[] = [];
    let automaticLinkDepth = 0;
    let linkDepth = 0;
    for (const child of token.children) {
      if (child.type === "html_inline") {
        htmlCodeDepth = codeDepthAfterHtml(child.content, htmlCodeDepth);
        nextChildren.push(child);
        continue;
      }
      if (child.type === "link_open") {
        linkDepth += 1;
        if (child.markup === "linkify" || child.markup === "autolink") {
          automaticLinkDepth += 1;
        }
        nextChildren.push(child);
        continue;
      }
      if (child.type === "link_close") {
        nextChildren.push(child);
        linkDepth = Math.max(0, linkDepth - 1);
        if (child.markup === "linkify" || child.markup === "autolink") {
          automaticLinkDepth = Math.max(0, automaticLinkDepth - 1);
        }
        continue;
      }
      if (
        htmlCodeDepth > 0 ||
        automaticLinkDepth > 0 ||
        child.type !== "text" ||
        !child.content.includes(":") ||
        (linkDepth > 0 && isUrlLabel(child.content, md))
      ) {
        nextChildren.push(child);
        continue;
      }

      for (const emoji of emojiTokens(child.content, state, md)) {
        nextChildren.push(emoji);
      }
    }

    token.children = nextChildren;
  }
}

function codeDepthAfterHtml(html: string, depth: number): number {
  let position = 0;
  while ((position = html.indexOf("<", position)) !== -1) {
    // Consume comments and other opaque markup before looking for tag names.
    const marker = html.startsWith("<!--", position)
      ? "-->"
      : html.startsWith("<![CDATA[", position)
        ? "]]>"
        : html.startsWith("<?", position)
          ? "?>"
          : undefined;
    if (marker) {
      const end = html.indexOf(marker, position + 2);
      position = end === -1 ? html.length : end + marker.length;
      continue;
    }

    const closing = html[position + 1] === "/";
    const nameStart = position + (closing ? 2 : 1);
    if (!/[a-z!]/i.test(html[nameStart] ?? "")) {
      position += 1;
      continue;
    }
    let nameEnd = nameStart;
    while (/[a-z0-9-]/i.test(html[nameEnd] ?? "")) {
      nameEnd += 1;
    }
    const name = html.slice(nameStart, nameEnd).toLowerCase();
    if ((!name || !/[\s/>]/.test(html[nameEnd] ?? "")) && html[nameStart] !== "!") {
      position += 1;
      continue;
    }

    // Scan each tag once, keeping apparent tags inside quoted attributes opaque.
    let quote: string | undefined;
    let end = nameEnd;
    for (; end < html.length; end += 1) {
      const character = html[end];
      if (quote) {
        if (character === quote) quote = undefined;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ">") {
        break;
      }
    }
    if (end === html.length) break;
    if (name === "code") depth = closing ? Math.max(0, depth - 1) : depth + 1;
    position = end + 1;
  }
  return depth;
}

function isUrlLabel(content: string, md: MarkdownIt): boolean {
  // Explicit links are excluded from MarkdownIt's linkify rule. Reuse its URL
  // recognition for complete URL labels, while keeping ordinary labels eligible.
  return !/\s/.test(content) && md.linkify.match(content)?.[0]?.index === 0;
}

function emojiTokens(content: string, state: MarkdownState, md: MarkdownIt): MarkdownToken[] {
  const tokens: MarkdownToken[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(shortcodePattern)) {
    const fullMatch = match[0];
    const name = match[1];
    const matchIndex = match.index ?? -1;

    if (!name || matchIndex < 0) {
      continue;
    }

    const emoji = emojiToken(name, state, md);
    if (!emoji) {
      continue;
    }

    if (matchIndex > lastIndex) {
      tokens.push(textToken(content.slice(lastIndex, matchIndex), state));
    }

    tokens.push(emoji);
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex === 0) {
    return [textToken(content, state)];
  }

  if (lastIndex < content.length) {
    tokens.push(textToken(content.slice(lastIndex), state));
  }

  return tokens;
}

function emojiToken(name: string, state: MarkdownState, md: MarkdownIt): MarkdownToken | undefined {
  const unicodeEmoji = githubUnicodeEmojiByAlias[name as keyof typeof githubUnicodeEmojiByAlias];
  if (unicodeEmoji) {
    if (wrappedUnicodeEmojiAliases.has(name)) {
      const token = new state.Token("html_inline", "", 0);
      token.content = `<g-emoji class="g-emoji" alias="${md.utils.escapeHtml(name)}">${md.utils.escapeHtml(unicodeEmoji)}</g-emoji>`;
      return token;
    }
    return textToken(unicodeEmoji, state);
  }

  const imageUrl = githubImageEmojiByAlias[name as keyof typeof githubImageEmojiByAlias];
  if (!imageUrl) {
    return undefined;
  }

  const token = new state.Token("html_inline", "", 0);
  const alt = md.utils.escapeHtml(`:${name}:`);
  const src = md.utils.escapeHtml(imageUrl.replace(/\?v\d+$/, ""));
  token.content = `<img class="emoji" title="${alt}" alt="${alt}" src="${src}" height="${EMOJI_IMAGE_SIZE}" width="${EMOJI_IMAGE_SIZE}" align="absmiddle">`;
  return token;
}

function textToken(content: string, state: MarkdownState): MarkdownToken {
  const token = new state.Token("text", "", 0);
  token.content = content;
  return token;
}
