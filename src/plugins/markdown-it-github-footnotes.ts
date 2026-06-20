import type MarkdownIt from "markdown-it";

type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];
type MarkdownState = {
  Token: new (...args: unknown[]) => MarkdownToken;
  env: Record<string, unknown>;
  tokens: MarkdownToken[];
};

const footnoteDefinitionPattern = /^\[\^([^\]\n]+)\]:[ \t]*([\s\S]*)$/;
const footnoteReferencePattern = /\[\^([^\]\n]+)\]/g;
const footnoteOrderKey = "githubMarkdownFootnoteOrder";

export default function markdownItGitHubFootnotes(md: MarkdownIt): MarkdownIt {
  md.core.ruler.after("inline", "github-markdown-footnotes", (state) => {
    const markdownState = state as unknown as MarkdownState;
    const footnotes = collectFootnotes(markdownState.tokens);
    markdownState.tokens = footnotes.tokens;

    applyFootnoteReferences(markdownState, footnotes.definitions);

    if (footnotes.definitions.size > 0) {
      appendFootnoteSection(markdownState, footnotes.definitions, md);
    }
  });

  return md;
}

function collectFootnotes(tokens: MarkdownToken[]): {
  definitions: Map<string, string>;
  tokens: MarkdownToken[];
} {
  const definitions = new Map<string, string>();
  const output: MarkdownToken[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const paragraphOpen = tokens[index];
    const inline = tokens[index + 1];
    const paragraphClose = tokens[index + 2];

    if (
      paragraphOpen?.type === "paragraph_open" &&
      inline?.type === "inline" &&
      paragraphClose?.type === "paragraph_close"
    ) {
      const match = inline.content.match(footnoteDefinitionPattern);
      if (match) {
        const rawLabel = match[1];
        const definition = match[2] ?? "";
        if (!rawLabel) {
          continue;
        }

        definitions.set(rawLabel.trim(), definition);
        index += 2;
        continue;
      }
    }

    const token = tokens[index];
    if (token) {
      output.push(token);
    }
  }

  return {
    definitions,
    tokens: output
  };
}

function applyFootnoteReferences(state: MarkdownState, definitions: Map<string, string>) {
  if (definitions.size === 0) {
    return;
  }

  const numbers = new Map<string, number>();

  for (const token of state.tokens) {
    if (token.type !== "inline" || !token.children) {
      continue;
    }

    const nextChildren: MarkdownToken[] = [];
    for (const child of token.children) {
      if (child.type !== "text") {
        nextChildren.push(child);
        continue;
      }

      let lastIndex = 0;
      let matched = false;

      for (const match of child.content.matchAll(footnoteReferencePattern)) {
        const fullMatch = match[0];
        const label = match[1]?.trim();
        const matchIndex = match.index ?? -1;

        if (!label || !definitions.has(label) || matchIndex < 0) {
          continue;
        }

        if (matchIndex > lastIndex) {
          const textToken = new state.Token("text", "", 0);
          textToken.content = child.content.slice(lastIndex, matchIndex);
          nextChildren.push(textToken);
        }

        const number = numbers.get(label) ?? numbers.size + 1;
        numbers.set(label, number);

        const htmlToken = new state.Token("html_inline", "", 0);
        htmlToken.content = `<sup class="footnote-ref"><a href="#user-content-fn-${number}" id="user-content-fnref-${number}" data-footnote-ref aria-describedby="footnote-label">${number}</a></sup>`;
        nextChildren.push(htmlToken);

        lastIndex = matchIndex + fullMatch.length;
        matched = true;
      }

      if (!matched) {
        nextChildren.push(child);
        continue;
      }

      if (lastIndex < child.content.length) {
        const textToken = new state.Token("text", "", 0);
        textToken.content = child.content.slice(lastIndex);
        nextChildren.push(textToken);
      }
    }

    token.children = nextChildren;
  }

  state.env[footnoteOrderKey] = [...numbers.entries()]
    .sort((left, right) => left[1] - right[1])
    .map(([label]) => label);
}

function appendFootnoteSection(
  state: MarkdownState,
  definitions: Map<string, string>,
  md: MarkdownIt
) {
  const footnoteOrder = state.env[footnoteOrderKey];
  const referencedLabels = Array.isArray(footnoteOrder)
    ? footnoteOrder.filter((label): label is string => typeof label === "string")
    : [];
  if (referencedLabels.length === 0) {
    return;
  }

  const items = referencedLabels
    .map((label, index) => {
      const definition = definitions.get(label);
      if (!definition) {
        return "";
      }

      const number = index + 1;
      const content = md.renderInline(definition, {});
      return `<li id="user-content-fn-${number}"><p>${content} <a href="#user-content-fnref-${number}" class="footnote-backref" data-footnote-backref aria-label="Back to content">↩</a></p></li>`;
    })
    .filter(Boolean)
    .join("");

  if (items.length === 0) {
    return;
  }

  const footnotesToken = new state.Token("html_block", "", 0);
  footnotesToken.content =
    `<section class="footnotes" data-footnotes>\n` +
    `<h2 class="sr-only" id="footnote-label">Footnotes</h2>\n` +
    `<ol>\n${items}\n</ol>\n` +
    `</section>\n`;

  state.tokens.push(footnotesToken);
}
