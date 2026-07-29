import { l10n } from "vscode";
import type MarkdownIt from "markdown-it";
import type { MarkdownToken, MarkdownState } from "./shared";

type FootnoteReference = {
  label: string;
  number: number;
  referenceCount: number;
};

type FootnoteState = MarkdownState & {
  src: string;
};

const footnoteDefinitionLinePattern = /^\[\^([^\]\n]+)\]:[ \t]*(.*)$/;
const footnoteReferencePattern = /\[\^([^\]\n]+)\]/g;
const footnoteOrderKey = "githubMarkdownFootnoteOrder";
const footnoteReferencesKey = "githubMarkdownFootnoteReferences";

export default function markdownItGitHubFootnotes(md: MarkdownIt): MarkdownIt {
  md.core.ruler.after("inline", "github-markdown-footnotes", (state) => {
    const markdownState = state as unknown as FootnoteState;
    const footnotes = collectFootnotes(markdownState.tokens, markdownState.src);
    markdownState.tokens = footnotes.tokens;

    applyFootnoteReferences(markdownState, footnotes.definitions);

    if (footnotes.definitions.size > 0) {
      appendFootnoteSection(markdownState, footnotes.definitions, md);
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
          const lastLabel = [...parsedDefinitions.keys()].pop();
          if (continuation && lastLabel) {
            const definition = parsedDefinitions.get(lastLabel) ?? "";
            parsedDefinitions.set(
              lastLabel,
              normalizeFootnoteDefinition(`${definition}\n\n${continuation.markdown}`)
            );
            definitionEnd = continuation.endLine;
          }
        }

        for (const [label, definition] of parsedDefinitions) {
          definitions.set(label, definition);
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

function parseFootnoteDefinitions(content: string): Map<string, string> | undefined {
  const definitions = new Map<string, string>();
  let currentLabel: string | undefined;
  let currentLines: string[] = [];

  const commit = () => {
    if (!currentLabel) return;
    definitions.set(currentLabel, normalizeFootnoteDefinition(currentLines.join("\n")));
  };

  for (const line of content.split("\n")) {
    const match = line.match(footnoteDefinitionLinePattern);
    if (match) {
      commit();
      currentLabel = match[1]?.trim();
      currentLines = [match[2] ?? ""];
      continue;
    }
    if (!currentLabel) return undefined;
    currentLines.push(line);
  }
  commit();
  return definitions.size > 0 ? definitions : undefined;
}

function applyFootnoteReferences(state: MarkdownState, definitions: Map<string, string>) {
  if (definitions.size === 0) {
    return;
  }

  const numbers = new Map<string, number>();
  const referenceCounts = new Map<string, number>();
  const references: FootnoteReference[] = [];

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
        const referenceCount = (referenceCounts.get(label) ?? 0) + 1;
        referenceCounts.set(label, referenceCount);
        references.push({ label, number, referenceCount });

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

  state.env[footnoteOrderKey] = [...numbers.entries()]
    .sort((left, right) => left[1] - right[1])
    .map(([label]) => label);
  state.env[footnoteReferencesKey] = references;
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
  const references = footnoteReferences(state);
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
      const backrefs = references
        .filter((reference) => reference.label === label)
        .map((reference) => renderBackref(reference.number, reference.referenceCount))
        .join(" ");
      const content = renderFootnoteDefinition(definition, backrefs, state, md);
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

function renderFootnoteDefinition(
  definition: string,
  backrefs: string,
  state: MarkdownState,
  md: MarkdownIt
): string {
  const tokens = md.parse(definition, {});
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

  const content = md.renderer.render(tokens, md.options, {}).trimEnd();
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
