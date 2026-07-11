export function stripSyntaxTokenMarkup(html: string): string {
  return html.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_match, open, code, close) => {
    if (!/<span\b[^>]*class="[^"]*\bpl-[^"]*"/i.test(code)) return `${open}${code}${close}`;
    return `${open}${code.replace(/<\/?span\b[^>]*>/gi, "")}${close}`;
  });
}

export function stripPlatformWrapperMarkup(html: string): string {
  return html.replace(/<\/?markdown-accessiblity-table\b[^>]*>/gi, "");
}
