import type MarkdownIt from "markdown-it";

type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];
type MarkdownState = {
  Token: new (...args: unknown[]) => MarkdownToken;
  tokens: MarkdownToken[];
};

const alertTitles = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution"
} as const;

type AlertKind = keyof typeof alertTitles;

const alertMarkerPattern = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/i;

export default function markdownItGitHubAlerts(md: MarkdownIt): MarkdownIt {
  md.core.ruler.after("inline", "github-markdown-alerts", (state) => {
    applyAlerts(state as unknown as MarkdownState);
  });

  return md;
}

function applyAlerts(state: MarkdownState) {
  for (let index = 0; index < state.tokens.length - 2; index += 1) {
    const blockquoteOpen = state.tokens[index];
    if (blockquoteOpen?.type !== "blockquote_open") {
      continue;
    }

    const paragraphOpen = state.tokens[index + 1];
    const inline = state.tokens[index + 2];
    if (paragraphOpen?.type !== "paragraph_open" || inline?.type !== "inline") {
      continue;
    }

    const firstChild = inline.children?.[0];
    const markerMatch =
      firstChild?.type === "text" ? firstChild.content.match(alertMarkerPattern) : null;
    if (!markerMatch) {
      continue;
    }

    const marker = markerMatch[1];
    if (!marker) {
      continue;
    }

    const alertKind = marker.toLowerCase() as AlertKind;
    blockquoteOpen.attrJoin("class", `markdown-alert markdown-alert-${alertKind}`);
    paragraphOpen.attrJoin("class", "markdown-alert-body");

    const titleToken = new state.Token("html_inline", "", 0);
    titleToken.content = `<span class="markdown-alert-title">${alertTitles[alertKind]}</span>`;

    const bodyChildren = [...(inline.children ?? [])];
    bodyChildren.shift();
    if (bodyChildren[0]?.type === "softbreak" || bodyChildren[0]?.type === "hardbreak") {
      bodyChildren.shift();
    }

    inline.children = [titleToken, ...bodyChildren];
    inline.content = bodyChildren.map((token) => token.content).join("");
  }
}
