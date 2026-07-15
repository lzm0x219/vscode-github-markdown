import type MarkdownIt from "markdown-it";

const disallowedRawHtmlTag =
  /<(?=\/?(?:title|textarea|style|xmp|iframe|noembed|noframes|script|plaintext)(?:[\t\n\f\r />]|$))/gi;

function filterDisallowedRawHtml(html: string): string {
  return html.replace(disallowedRawHtmlTag, "&lt;");
}

export default function markdownItGitHubTagfilter(md: MarkdownIt): MarkdownIt {
  for (const ruleName of ["html_block", "html_inline"] as const) {
    const defaultRender =
      md.renderer.rules[ruleName] ??
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules[ruleName] = (tokens, idx, options, env, self) => {
      if (tokens[idx]) {
        tokens[idx].content = filterDisallowedRawHtml(tokens[idx].content);
      }
      return defaultRender(tokens, idx, options, env, self);
    };
  }

  return md;
}
