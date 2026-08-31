import { l10n } from "vscode";
import type { MarkdownIt, StateBlock } from "markdown-it";
import { caseFold } from "unicode-case-folding";
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

type FragmentRenderer = (tokens: MarkdownToken[], env: Record<string, unknown>) => string;

const footnoteDefinitionLinePattern = /^\[\^([^\]\n]+)\]:[ \t]*(.*)$/;
const footnoteReferencePattern = /\[\^([^\]\n]+)\]/g;
const footnoteDefinitionsKey = "githubMarkdownFootnoteDefinitions";
const footnoteHardbreakLabelsKey = "githubMarkdownFootnoteHardbreakLabels";
const nestedFootnoteParseKey = "githubMarkdownNestedFootnoteParse";
const footnoteOrderKey = "githubMarkdownFootnoteOrder";
const footnoteReferencesKey = "githubMarkdownFootnoteReferences";

export default function markdownItGitHubFootnotes(md: MarkdownIt): MarkdownIt {
  const render = md.renderer.render.bind(md.renderer);
  const renderFragment: FragmentRenderer = (tokens, env) => render(tokens, md.options, env);

  md.block.ruler.before(
    "reference",
    "github-markdown-footnote-definition",
    footnoteDefinitionBlock,
    { alt: ["paragraph", "reference"] }
  );

  md.inline.ruler.before("escape", "github-markdown-footnote-reference", (state, silent) => {
    if (silent) {
      return false;
    }

    const match = state.src.slice(state.pos).match(/^\[\^([^\]\n]+)\]/);
    const fullMatch = match?.[0];
    const label = normalizeFootnoteLabel(match?.[1] ?? "");
    if (!fullMatch || !label || !footnoteDefinitions(state).has(label)) {
      return false;
    }

    const token = state.push("text", "", 0);
    token.content = fullMatch;
    state.pos += fullMatch.length;
    return true;
  });

  md.core.ruler.after("inline", "github-markdown-footnotes", (state) => {
    if (state.env[nestedFootnoteParseKey] === true) {
      return;
    }

    const markdownState = state as unknown as MarkdownState;
    const definitions = footnoteDefinitions(markdownState);
    const definitionTokens = applyFootnoteReferences(markdownState, definitions, md);

    if (definitions.size > 0) {
      appendFootnoteSection(markdownState, definitionTokens, renderFragment);
    }
  });

  return md;
}

function footnoteDefinitionBlock(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean
): boolean {
  if ((state.sCount[startLine] ?? 0) - state.blkIndent >= 4) {
    return false;
  }

  const lineStart = (state.bMarks[startLine] ?? 0) + (state.tShift[startLine] ?? 0);
  const lineEnd = state.eMarks[startLine] ?? lineStart;
  const match = state.src.slice(lineStart, lineEnd).match(footnoteDefinitionLinePattern);
  if (!match) {
    return false;
  }
  if (silent) {
    return true;
  }

  let definition = match[2] ?? "";
  const hasInlineDefinition = definition.length > 0;
  let scanLine = startLine + 1;
  let definitionEnd = scanLine;
  let pendingBlankLines = 0;
  const continuationLines: string[] = [];

  for (; scanLine < endLine; scanLine += 1) {
    if (state.isEmpty(scanLine)) {
      pendingBlankLines += 1;
      continue;
    }
    if ((state.sCount[scanLine] ?? 0) - state.blkIndent < 4) {
      break;
    }

    continuationLines.push(...Array.from({ length: pendingBlankLines }, () => ""));
    continuationLines.push(state.getLines(scanLine, scanLine + 1, state.blkIndent + 4, false));
    pendingBlankLines = 0;
    definitionEnd = scanLine + 1;
  }

  if (continuationLines.length > 0) {
    definition = `${definition}\n${continuationLines.join("\n")}`;
  }

  const label = normalizeFootnoteLabel(match[1] ?? "");
  const definitions = footnoteDefinitions(state);
  if (label && !definitions.has(label)) {
    definitions.set(label, normalizeFootnoteDefinition(definition));
    if (hasInlineDefinition && continuationLines.length > 0) {
      const hardbreakLabels = footnoteHardbreakLabels(state);
      hardbreakLabels.add(label);
      state.env[footnoteHardbreakLabelsKey] = hardbreakLabels;
    }
  }
  state.env[footnoteDefinitionsKey] = definitions;
  state.line = definitionEnd;
  return true;
}

function footnoteDefinitions(state: { env: Record<string, unknown> }): Map<string, string> {
  const definitions = state.env[footnoteDefinitionsKey];
  return definitions instanceof Map ? definitions : new Map();
}

function footnoteHardbreakLabels(state: { env: Record<string, unknown> }): Set<string> {
  const labels = state.env[footnoteHardbreakLabelsKey];
  return labels instanceof Set ? labels : new Set();
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
    if (!label || definition === undefined) {
      continue;
    }

    const tokens = parseFootnoteDefinition(md, definition, state.env);
    if (footnoteHardbreakLabels(state).has(label)) {
      promoteSoftbreaks(tokens);
    }
    applyFootnoteReferencesToTokens(tokens, state, graph);
    definitionTokens.set(label, tokens);
  }

  state.env[footnoteOrderKey] = graph.order;
  state.env[footnoteReferencesKey] = graph.references;
  return definitionTokens;
}

function parseFootnoteDefinition(
  md: MarkdownIt,
  definition: string,
  env: Record<string, unknown>
): MarkdownToken[] {
  const hadNestedParseFlag = Object.hasOwn(env, nestedFootnoteParseKey);
  const previousNestedParseFlag = env[nestedFootnoteParseKey];
  env[nestedFootnoteParseKey] = true;

  try {
    return md.parse(definition, env);
  } finally {
    if (hadNestedParseFlag) {
      env[nestedFootnoteParseKey] = previousNestedParseFlag;
    } else {
      delete env[nestedFootnoteParseKey];
    }
  }
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
    let linkDepth = 0;
    let deferredLinkReferences: MarkdownToken[] = [];
    for (const child of token.children) {
      if (child.type === "link_open") {
        linkDepth += 1;
        nextChildren.push(child);
        continue;
      }
      if (child.type === "link_close") {
        nextChildren.push(child);
        linkDepth = Math.max(0, linkDepth - 1);
        if (linkDepth === 0 && deferredLinkReferences.length > 0) {
          nextChildren.push(...deferredLinkReferences);
          deferredLinkReferences = [];
        }
        continue;
      }
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
        const anchor = renderFootnoteReferenceAnchor(number, referenceCount);
        if (linkDepth > 0) {
          htmlToken.content = "<sup></sup>";
          const deferredReference = new state.Token("html_inline", "", 0);
          deferredReference.content = anchor;
          deferredLinkReferences.push(deferredReference);
        } else {
          htmlToken.content = `<sup class="footnote-ref">${anchor}</sup>`;
        }
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
    nextChildren.push(...deferredLinkReferences);

    token.children = nextChildren;
  }
}

function promoteSoftbreaks(tokens: MarkdownToken[]): void {
  for (const token of tokens) {
    if (token.type !== "inline" || !token.children) {
      continue;
    }
    for (const child of token.children) {
      if (child.type === "softbreak") {
        child.type = "hardbreak";
        child.tag = "br";
      }
    }
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
  return definition.replace(/^\n+/, "").trimEnd();
}

function normalizeFootnoteLabel(label: string): string {
  return caseFold(label.trim());
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

  const trailingParagraphInline =
    tokens.at(-1)?.type === "paragraph_close" ? lastInline : undefined;
  if (trailingParagraphInline?.children) {
    const separator = new state.Token("text", "", 0);
    separator.content = " ";
    const backref = new state.Token("html_inline", "", 0);
    backref.content = backrefs;
    trailingParagraphInline.children.push(separator, backref);
  }

  const content = renderFragment(tokens, state.env).trimEnd();
  return trailingParagraphInline ? content : `${content}\n${backrefs}`;
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

function renderFootnoteReferenceAnchor(number: number, referenceCount: number): string {
  return `<a href="#user-content-fn-${number}" id="${footnoteReferenceId(
    number,
    referenceCount
  )}" data-footnote-ref="" aria-describedby="footnote-label">${number}</a>`;
}

function footnoteReferenceId(number: number, referenceCount: number): string {
  return `user-content-fnref-${number}${referenceCount === 1 ? "" : `-${referenceCount}`}`;
}
