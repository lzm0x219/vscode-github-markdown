import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import strikethrough from "../../src/plugins/markdown-it-github-strikethrough";

function render(markdown: string): string {
  return new MarkdownIt().use(strikethrough).render(markdown);
}

describe("markdown-it-github-strikethrough", () => {
  it("adds del markup for one tilde and preserves existing markup for two", () => {
    expect(render("~~Hi~~ Hello, ~there~ world!\n")).toBe(
      "<p><s>Hi</s> Hello, <del>there</del> world!</p>\n"
    );
  });

  it.each([
    ["escaped tildes", "\\~escaped\\~\n", "<p>~escaped~</p>\n"],
    ["code spans", "`~code~`\n", "<p><code>~code~</code></p>\n"],
    ["empty delimiters", "~~\n", "<p>~~</p>\n"],
    ["unmatched delimiters", "~open\n", "<p>~open</p>\n"],
    ["runs longer than two", "Long: ~~~not~~~.\n", "<p>Long: ~~~not~~~.</p>\n"]
  ])("keeps %s literal", (_name, markdown, expected) => {
    expect(render(markdown)).toBe(expected);
  });
});
