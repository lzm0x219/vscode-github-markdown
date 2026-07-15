import type MarkdownIt from "markdown-it";
import type { MarkdownToken } from "./shared";

const automaticDirectionRules = [
  "heading_open",
  "paragraph_open",
  "bullet_list_open",
  "ordered_list_open"
] as const;
const codeRules = ["fence", "code_block"] as const;

export default function markdownItGitHubDirectionality(md: MarkdownIt): MarkdownIt {
  for (const ruleName of automaticDirectionRules) {
    wrapRendererRule(md, ruleName, normalizeAutomaticDirection);
  }
  wrapRendererRule(md, "blockquote_open", (token) => {
    if (token.tag === "div" && token.attrGet("class")?.split(/\s+/).includes("markdown-alert")) {
      normalizeAutomaticDirection(token);
    }
  });
  for (const ruleName of codeRules) {
    wrapRendererRule(md, ruleName, (token) => removeAttribute(token, "dir"));
  }

  return md;
}

function wrapRendererRule(
  md: MarkdownIt,
  ruleName: string,
  transform: (token: MarkdownToken) => void
): void {
  const defaultRender =
    md.renderer.rules[ruleName] ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules[ruleName] = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token) {
      transform(token);
    }
    return defaultRender(tokens, idx, options, env, self);
  };
}

function normalizeAutomaticDirection(token: MarkdownToken): void {
  const directions = token.attrGet("dir")?.split(/\s+/) ?? [];
  const explicitDirection = directions.find(
    (direction) => direction === "ltr" || direction === "rtl"
  );
  token.attrSet("dir", explicitDirection ?? "auto");
}

function removeAttribute(token: MarkdownToken, name: string): void {
  const index = token.attrIndex(name);
  if (index >= 0) {
    token.attrs?.splice(index, 1);
  }
}
