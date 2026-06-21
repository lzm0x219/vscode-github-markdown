import MarkdownIt from "markdown-it";

function rewriteImgSrc(html: string): string {
  return html.replace(
    /<img\b([^>]*?)\bsrc=(["'])(\/[^"']+)\2([^>]*)>/gi,
    (_match, before, quote, src, after) => {
      return `<img${before}src=${quote}.${src}${quote}${after}>`;
    }
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
