import type MarkdownIt from "markdown-it";
import { githubImageEmojiByAlias, githubUnicodeEmojiByAlias } from "../generated/github-emojis";

type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];
type MarkdownState = {
  Token: new (...args: unknown[]) => MarkdownToken;
  tokens: MarkdownToken[];
};

const shortcodePattern = /:([+\-\w]+):/g;

export default function markdownItGitHubEmoji(md: MarkdownIt): MarkdownIt {
  md.core.ruler.after("inline", "github-markdown-emoji", (state) => {
    applyEmojiShortcodes(state as unknown as MarkdownState, md);
  });

  return md;
}

function applyEmojiShortcodes(state: MarkdownState, md: MarkdownIt) {
  for (const token of state.tokens) {
    if (token.type !== "inline" || !token.children) {
      continue;
    }

    const nextChildren: MarkdownToken[] = [];
    for (const child of token.children) {
      if (child.type !== "text" || !child.content.includes(":")) {
        nextChildren.push(child);
        continue;
      }

      nextChildren.push(...emojiTokens(child.content, state, md));
    }

    token.children = nextChildren;
  }
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
    return textToken(unicodeEmoji, state);
  }

  const imageUrl = githubImageEmojiByAlias[name as keyof typeof githubImageEmojiByAlias];
  if (!imageUrl) {
    return undefined;
  }

  const token = new state.Token("html_inline", "", 0);
  const alt = md.utils.escapeHtml(`:${name}:`);
  const src = md.utils.escapeHtml(imageUrl);
  token.content = `<img class="emoji" alt="${alt}" src="${src}" height="20" width="20">`;
  return token;
}

function textToken(content: string, state: MarkdownState): MarkdownToken {
  const token = new state.Token("text", "", 0);
  token.content = content;
  return token;
}
