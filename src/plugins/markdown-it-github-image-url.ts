import type MarkdownIt from "markdown-it";

const imageTagPattern = /<img(?=[\t\n\f\r />])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const projectRootSrcAttributePattern =
  /(<img(?:[^"'<>]|"[^"]*"|'[^']*')*?[\t\n\f\r ]+src[\t\n\f\r ]*=[\t\n\f\r ]*)(?:(["'])(\/(?!\/)[^"']+)\2|(\/(?!\/)[^\t\n\f\r "'`=<>]+))/i;

function rewriteImgSrc(html: string): string {
  return html.replace(imageTagPattern, (imageTag) =>
    imageTag.replace(
      projectRootSrcAttributePattern,
      (_match, before, quote = "", quotedSrc, unquotedSrc) =>
        `${before}${quote}.${quotedSrc ?? unquotedSrc}${quote}`
    )
  );
}

export default function markdownItImageUrl(md: MarkdownIt): MarkdownIt {
  for (const ruleName of ["html_block", "html_inline"] as const) {
    const defaultRender =
      md.renderer.rules[ruleName] ??
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules[ruleName] = (tokens, idx, options, env, self) => {
      if (tokens[idx]) {
        tokens[idx].content = rewriteImgSrc(tokens[idx].content);
      }
      return defaultRender(tokens, idx, options, env, self);
    };
  }
  return md;
}
