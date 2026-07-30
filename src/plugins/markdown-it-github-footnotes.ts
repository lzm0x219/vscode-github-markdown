import { l10n } from "vscode";
import type MarkdownIt from "markdown-it";
import type { MarkdownToken, MarkdownState } from "./shared";

type FootnoteReference = {
  label: string;
  number: number;
  referenceCount: number;
};

type FootnoteGraph = {
  definitions: Map<string, string>;
  order: string[];
  numbers: Map<string, number>;
  referenceCounts: Map<string, number>;
  references: FootnoteReference[];
};

type FootnoteState = MarkdownState & {
  src: string;
};

type FragmentRenderer = (tokens: MarkdownToken[]) => string;

type ParsedFootnoteDefinition = {
  label: string;
  definition: string;
};

const footnoteDefinitionLinePattern = /^\[\^([^\]\n]+)\]:[ \t]*(.*)$/;
const footnoteReferencePattern = /\[\^([^\]\n]+)\]/g;
const footnoteOrderKey = "githubMarkdownFootnoteOrder";
const footnoteReferencesKey = "githubMarkdownFootnoteReferences";

export default function markdownItGitHubFootnotes(md: MarkdownIt): MarkdownIt {
  const render = md.renderer.render.bind(md.renderer);
  const renderFragment: FragmentRenderer = (tokens) => render(tokens, md.options, {});

  md.core.ruler.after("inline", "github-markdown-footnotes", (state) => {
    const markdownState = state as unknown as FootnoteState;
    const footnotes = collectFootnotes(markdownState.tokens, markdownState.src);
    markdownState.tokens = footnotes.tokens;

    const definitionTokens = applyFootnoteReferences(markdownState, footnotes.definitions, md);

    if (footnotes.definitions.size > 0) {
      appendFootnoteSection(markdownState, definitionTokens, renderFragment);
    }
  });

  return md;
}

function collectFootnotes(
  tokens: MarkdownToken[],
  source: string
): {
  definitions: Map<string, string>;
  tokens: MarkdownToken[];
} {
  const definitions = new Map<string, string>();
  const output: MarkdownToken[] = [];
  const sourceLines = source.split("\n");

  for (let index = 0; index < tokens.length; index += 1) {
    const paragraphOpen = tokens[index];
    const inline = tokens[index + 1];
    const paragraphClose = tokens[index + 2];

    if (
      paragraphOpen?.type === "paragraph_open" &&
      inline?.type === "inline" &&
      paragraphClose?.type === "paragraph_close"
    ) {
      const parsedDefinitions = parseFootnoteDefinitions(inline.content);
      if (parsedDefinitions) {
        let definitionEnd = paragraphOpen.map?.[1];
        if (definitionEnd !== undefined) {
          const continuation = collectFootnoteContinuation(sourceLines, definitionEnd);
          const lastDefinition = parsedDefinitions.at(-1);
          if (continuation && lastDefinition) {
            lastDefinition.definition = normalizeFootnoteDefinition(
              `${lastDefinition.definition}\n\n${continuation.markdown}`
            );
            definitionEnd = continuation.endLine;
          }
        }

        for (const { label, definition } of parsedDefinitions) {
          if (!definitions.has(label)) {
            definitions.set(label, definition);
          }
        }

        index += 2;
        while (definitionEnd !== undefined) {
          const nextTokenStart = tokens[index + 1]?.map?.[0];
          if (nextTokenStart === undefined || nextTokenStart >= definitionEnd) {
            break;
          }
          index += 1;
        }
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

function collectFootnoteContinuation(
  sourceLines: string[],
  startLine: number
): { markdown: string; endLine: number } | undefined {
  const markdownLines: string[] = [];
  let pendingBlankLines = 0;
  let lineIndex = startLine;

  for (; lineIndex < sourceLines.length; lineIndex += 1) {
    const line = sourceLines[lineIndex] ?? "";
    if (/^[ \t]*$/.test(line)) {
      pendingBlankLines += 1;
      continue;
    }

    const continuation = line.match(/^(?: {4}|\t)(.*)$/);
    if (!continuation) {
      break;
    }

    markdownLines.push(...Array.from({ length: pendingBlankLines }, () => ""));
    markdownLines.push(continuation[1] ?? "");
    pendingBlankLines = 0;
  }

  if (markdownLines.length === 0) {
    return undefined;
  }

  return {
    markdown: markdownLines.join("\n"),
    endLine: lineIndex
  };
}

function parseFootnoteDefinitions(content: string): ParsedFootnoteDefinition[] | undefined {
  const definitions: ParsedFootnoteDefinition[] = [];
  let currentLabel: string | undefined;
  let currentLines: string[] = [];

  const commit = () => {
    if (!currentLabel) return;
    definitions.push({
      label: currentLabel,
      definition: normalizeFootnoteDefinition(currentLines.join("\n"))
    });
  };

  for (const line of content.split("\n")) {
    const match = line.match(footnoteDefinitionLinePattern);
    if (match) {
      commit();
      currentLabel = normalizeFootnoteLabel(match[1] ?? "");
      currentLines = [match[2] ?? ""];
      continue;
    }
    if (!currentLabel) return undefined;
    currentLines.push(line);
  }
  commit();
  return definitions.length > 0 ? definitions : undefined;
}

function applyFootnoteReferences(
  state: MarkdownState,
  definitions: Map<string, string>,
  md: MarkdownIt
): Map<string, MarkdownToken[]> {
  const definitionTokens = new Map<string, MarkdownToken[]>();
  if (definitions.size === 0) {
    return definitionTokens;
  }

  const graph: FootnoteGraph = {
    definitions,
    order: [],
    numbers: new Map<string, number>(),
    referenceCounts: new Map<string, number>(),
    references: []
  };

  applyFootnoteReferencesToTokens(state.tokens, state, graph);

  for (let index = 0; index < graph.order.length; index += 1) {
    const label = graph.order[index];
    const definition = label ? definitions.get(label) : undefined;
    if (!label || !definition) {
      continue;
    }

    const tokens = md.parse(definition, {});
    applyFootnoteReferencesToTokens(tokens, state, graph);
    definitionTokens.set(label, tokens);
  }

  state.env[footnoteOrderKey] = graph.order;
  state.env[footnoteReferencesKey] = graph.references;
  return definitionTokens;
}

function applyFootnoteReferencesToTokens(
  tokens: MarkdownToken[],
  state: MarkdownState,
  graph: FootnoteGraph
): void {
  for (const token of tokens) {
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
        const label = normalizeFootnoteLabel(match[1] ?? "");
        const matchIndex = match.index ?? -1;

        if (!label || !graph.definitions.has(label) || matchIndex < 0) {
          continue;
        }

        if (matchIndex > lastIndex) {
          const textToken = new state.Token("text", "", 0);
          textToken.content = child.content.slice(lastIndex, matchIndex);
          nextChildren.push(textToken);
        }

        let number = graph.numbers.get(label);
        if (number === undefined) {
          number = graph.order.length + 1;
          graph.numbers.set(label, number);
          graph.order.push(label);
        }
        const referenceCount = (graph.referenceCounts.get(label) ?? 0) + 1;
        graph.referenceCounts.set(label, referenceCount);
        graph.references.push({ label, number, referenceCount });

        const htmlToken = new state.Token("html_inline", "", 0);
        htmlToken.content = `<sup class="footnote-ref"><a href="#user-content-fn-${number}" id="${footnoteReferenceId(
          number,
          referenceCount
        )}" data-footnote-ref="" aria-describedby="footnote-label">${number}</a></sup>`;
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
}

function appendFootnoteSection(
  state: MarkdownState,
  definitionTokens: Map<string, MarkdownToken[]>,
  renderFragment: FragmentRenderer
) {
  const footnoteOrder = state.env[footnoteOrderKey];
  const referencedLabels = Array.isArray(footnoteOrder)
    ? footnoteOrder.filter((label): label is string => typeof label === "string")
    : [];
  const references = footnoteReferences(state);
  if (referencedLabels.length === 0) {
    return;
  }

  const items = referencedLabels
    .map((label, index) => {
      const tokens = definitionTokens.get(label);
      if (!tokens) {
        return "";
      }

      const number = index + 1;
      const backrefs = references
        .filter((reference) => reference.label === label)
        .map((reference) => renderBackref(reference.number, reference.referenceCount))
        .join(" ");
      const content = renderFootnoteDefinition(tokens, backrefs, state, renderFragment);
      return `<li id="user-content-fn-${number}">
${content}
</li>`;
    })
    .filter(Boolean)
    .join("");

  if (items.length === 0) {
    return;
  }

  const footnotesToken = new state.Token("html_block", "", 0);
  footnotesToken.content =
    `<section data-footnotes="" class="footnotes">\n` +
    `<h2 id="footnote-label" class="sr-only" dir="auto">${l10n.t("Footnotes")}</h2>\n` +
    `<ol dir="auto">\n${items}\n</ol>\n` +
    `</section>\n`;

  state.tokens.push(footnotesToken);
}

function normalizeFootnoteDefinition(definition: string): string {
  return definition
    .replace(/^\n/, "")
    .replace(/\n[ \t]{4}/g, "\n")
    .trim();
}

function normalizeFootnoteLabel(label: string): string {
  return label.trim().toLowerCase();
}

function renderFootnoteDefinition(
  tokens: MarkdownToken[],
  backrefs: string,
  state: MarkdownState,
  renderFragment: FragmentRenderer
): string {
  let lastInline: MarkdownToken | undefined;

  for (const token of tokens) {
    if (token.type === "paragraph_open") {
      token.attrSet("dir", "auto");
    }
    if (token.type === "inline" && token.children) {
      lastInline = token;
    }
  }

  if (lastInline?.children) {
    const separator = new state.Token("text", "", 0);
    separator.content = " ";
    const backref = new state.Token("html_inline", "", 0);
    backref.content = backrefs;
    lastInline.children.push(separator, backref);
  }

  const content = renderFragment(tokens).trimEnd();
  return lastInline ? content : `${content}\n<p dir="auto">${backrefs}</p>`;
}

function footnoteReferences(state: MarkdownState): FootnoteReference[] {
  const references = state.env[footnoteReferencesKey];
  if (!Array.isArray(references)) {
    return [];
  }

  return references.filter(isFootnoteReference);
}

function isFootnoteReference(reference: unknown): reference is FootnoteReference {
  return (
    typeof reference === "object" &&
    reference !== null &&
    "label" in reference &&
    "number" in reference &&
    "referenceCount" in reference &&
    typeof reference.label === "string" &&
    typeof reference.number === "number" &&
    typeof reference.referenceCount === "number"
  );
}

function renderBackref(number: number, referenceCount: number): string {
  const suffix = referenceCount === 1 ? "" : `-${referenceCount}`;
  const marker = referenceCount === 1 ? "" : `<sup>${referenceCount}</sup>`;
  return `<a href="#${footnoteReferenceId(
    number,
    referenceCount
  )}" data-footnote-backref="" aria-label="${l10n.t("Back to reference {0}{1}", number, suffix)}" class="data-footnote-backref">↩${marker}</a>`;
}

function footnoteReferenceId(number: number, referenceCount: number): string {
  return `user-content-fnref-${number}${referenceCount === 1 ? "" : `-${referenceCount}`}`;
}
