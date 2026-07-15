import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import alerts from "../../src/plugins/markdown-it-github-alerts";
import directionality from "../../src/plugins/markdown-it-github-directionality";

describe("markdown-it-github-directionality", () => {
  it("adds automatic direction to text containers while preserving code and explicit HTML", () => {
    const html = new MarkdownIt({ html: true })
      .use(directionality)
      .render(
        [
          "# مرحباً بالعالم",
          "",
          "فقرة عربية mixed English.",
          "",
          "- عنصر عربي",
          "",
          "1. Mixed item العربية",
          "",
          "Inline `code العربية`.",
          "",
          "```text",
          "block العربية",
          "```",
          "",
          "    indented العربية",
          "",
          '<p dir="rtl">explicit العربية</p>'
        ].join("\n")
      );

    expect(html).toContain('<h1 dir="auto">مرحباً بالعالم</h1>');
    expect(html).toContain('<p dir="auto">فقرة عربية mixed English.</p>');
    expect(html).toContain('<ul dir="auto">');
    expect(html).toContain('<ol dir="auto">');
    expect(html).not.toMatch(/<(?:pre|code)\b[^>]*\bdir=/);
    expect(html).toContain('<p dir="rtl">explicit العربية</p>');
  });

  it("normalizes host direction attributes and removes them from code blocks", () => {
    const markdown = new MarkdownIt().use(alerts);
    markdown.core.ruler.push("host-code-direction", (state) => {
      for (const token of state.tokens) {
        if (token.type === "fence" || token.type === "code_block") {
          token.attrSet("dir", "auto");
        } else if (token.type === "paragraph_open" || token.type === "blockquote_open") {
          token.attrJoin("dir", "auto");
        }
      }
    });
    markdown.use(directionality);

    const html = markdown.render(
      "> [!NOTE]\n> alert العربية\n\n```text\nblock العربية\n```\n\n    indented العربية\n"
    );

    expect(html).toContain('<div class="markdown-alert markdown-alert-note" dir="auto">');
    expect(html).toContain('<p dir="auto">alert العربية</p>');
    expect(html).not.toContain('dir="auto auto"');
    expect(html).not.toMatch(/<(?:pre|code)\b[^>]*\bdir=/);
  });
});
