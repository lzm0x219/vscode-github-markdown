import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import githubEmoji from "../../src/plugins/markdown-it-github-emoji";

describe("markdown-it-github-emoji", () => {
  it("renders Unicode emoji shortcode", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":rocket:");
    expect(html).toContain("🚀");
  });

  it("renders multiple Unicode emoji shortcodes", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":rocket: :+1: :tada:");
    expect(html).toContain("🚀");
    expect(html).toContain("👍");
    expect(html).toContain("🎉");
  });

  it("renders a paragraph with more emoji tokens than the function argument limit", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const count = 64_000;

    expect(md.render(":smile: ".repeat(count))).toBe(`<p>${"😄 ".repeat(count).trimEnd()}</p>\n`);
  });

  it("renders custom image emoji", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":shipit:");
    expect(html).toContain(
      '<img class="emoji" title=":shipit:" alt=":shipit:" src="https://github.githubassets.com/images/icons/emoji/shipit.png" height="20" width="20" align="absmiddle">'
    );
  });

  it("leaves unknown shortcode as-is", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":this-is-not-an-emoji:");
    expect(html).toContain(":this-is-not-an-emoji:");
  });

  it("does not modify text without colons", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render("Plain text without any emoji.");
    expect(html).toContain("Plain text without any emoji.");
  });

  it("handles emoji with plus sign", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":+1:");
    expect(html).toContain("👍");
  });

  it("handles emoji with minus sign", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":-1:");
    expect(html).toContain("👎");
  });

  it("uses GitHub's wrapper for warning emoji", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":warning:");
    expect(html).toContain('<g-emoji class="g-emoji" alias="warning">⚠️</g-emoji>');
  });

  it("does not rewrite shortcodes inside automatic links", () => {
    const md = new MarkdownIt({ linkify: true }).use(githubEmoji);
    const html = md.render("https://example.com/:rocket:");

    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="https://example.com/:rocket:"');
    expect(html).toContain("https://example.com/:rocket:");
    expect(html).not.toContain("🚀");
  });

  it.each([
    ["<code>:octocat:</code>", "<code>:octocat:</code>"],
    ["<code><span>:smile:</span></code> :smile:", "<code><span>:smile:</span></code> 😄"],
    [
      "<code>:smile:<code>:smile:</code>:smile:</code> :smile:",
      "<code>:smile:<code>:smile:</code>:smile:</code> 😄"
    ],
    ['<CODE title="a > b">:smile:</CODE> :smile:', '<CODE title="a > b">:smile:</CODE> 😄'],
    ["<code><!-- </code> -->:smile:</code> :smile:", "<code><!-- </code> -->:smile:</code> 😄"],
    ["<code/>:smile:</code> :smile:", "<code/>:smile:</code> 😄"],
    ["</code> :smile:", "</code> 😄"],
    ['<span title="<code>">:smile:</span> :smile:', '<span title="<code>">😄</span> 😄'],
    ["<tt>:smile:</tt> <kbd>:smile:</kbd>", "<tt>😄</tt> <kbd>😄</kbd>"]
  ])("preserves HTML code context in %s", (source, expected) => {
    expect(new MarkdownIt({ html: true }).use(githubEmoji).renderInline(source)).toBe(expected);
  });

  it("keeps HTML code context across paragraphs and resumes outside it", () => {
    const md = new MarkdownIt({ html: true }).use(githubEmoji);

    expect(md.render("<code>:smile:\n\n:smile:</code> :smile:")).toBe(
      "<p><code>:smile:</p>\n<p>:smile:</code> 😄</p>\n"
    );
    expect(md.render(":smile:")).toBe("<p>😄</p>\n");
  });

  it.each([
    ["<code>foo\n\n</code>\n\n:smile:", "<code>foo\n\n</code>\n\n😄"],
    [
      "<div><code>\n\n:smile:\n\n</code></div>\n\n:smile:",
      "<div><code>\n\n:smile:\n\n</code></div>\n\n😄"
    ],
    [
      "<div>`<code>`\n\n:smile:\n\n</code></div>\n\n:smile:",
      "<div>`<code>`\n\n:smile:\n\n</code></div>\n\n😄"
    ],
    ['<div title="<code>">\n\n:smile:', '<div title="<code>">\n\n😄'],
    [
      '<code>foo\n\n<div title="</code>">\n\n:smile:\n\n</code></div>\n\n:smile:',
      '<code>foo\n\n<div title="</code>">\n\n:smile:\n\n</code></div>\n\n😄'
    ],
    ["<!-- <code> -->\n\n:smile:", "<!-- <code> -->\n\n😄"],
    [
      "<code>foo\n\n<!-- </code> -->\n\n:smile:\n\n</code>\n\n:smile:",
      "<code>foo\n\n<!-- </code> -->\n\n:smile:\n\n</code>\n\n😄"
    ],
    ["<div><code>foo</code></div>\n\n:smile:", "<div><code>foo</code></div>\n\n😄"],
    ["<div>&lt;code&gt;</div>\n\n:smile:", "<div>&lt;code&gt;</div>\n\n😄"],
    ["<?instruction <code> ?>\n\n:smile:", "<?instruction <code> ?>\n\n😄"],
    ["<![CDATA[<code>]]>\n\n:smile:", "<![CDATA[<code>]]>\n\n😄"]
  ])("tracks code tags across HTML blocks in %s", (source, expectedSource) => {
    const md = new MarkdownIt({ html: true }).use(githubEmoji);

    expect(md.render(source)).toBe(new MarkdownIt({ html: true }).render(expectedSource));
  });

  it.each([
    "<https://example.com/:smile:>",
    "[https://example.com/:smile:](https://example.com/:smile:)",
    "[https://other.com/:smile:](https://example.com/)",
    "[www.example.com/:smile:](https://example.com/)",
    "[ftp://example.com/:smile:](https://example.com/)",
    "[**https://example.com/:smile:**](https://example.com/)",
    "[<span>https://example.com/:smile:</span>](https://example.com/)",
    "[https://example.com/:smile:][url]\n\n[url]: https://example.com/"
  ])("preserves URL link text in %s", (source) => {
    const md = new MarkdownIt({ html: true }).use(githubEmoji);

    expect(md.render(source)).toBe(new MarkdownIt({ html: true }).render(source));
  });

  it("still replaces emoji in ordinary link labels and following text", () => {
    const md = new MarkdownIt({ html: true }).use(githubEmoji);

    expect(
      md.renderInline(
        '[see :smile: **:rocket:**](https://example.com/:smile: "title :smile:") :smile:'
      )
    ).toBe(
      '<a href="https://example.com/:smile:" title="title :smile:">see 😄 <strong>🚀</strong></a> 😄'
    );
    expect(md.renderInline('<a href="https://example.com/">:smile:</a>')).toBe(
      '<a href="https://example.com/">😄</a>'
    );
    expect(md.renderInline("[note: :smile:](https://example.com/)")).toBe(
      '<a href="https://example.com/">note: 😄</a>'
    );
    expect(
      md.renderInline("[:smile: https://example.com/:smile: :smile:](https://example.com/)")
    ).toBe('<a href="https://example.com/">😄 https://example.com/😄 😄</a>');
    expect(
      md.renderInline("[<span>https://example.com/:smile:</span> :smile:](https://example.com/)")
    ).toBe('<a href="https://example.com/"><span>https://example.com/:smile:</span> 😄</a>');
  });

  it("preserves Markdown code and escaped shortcodes", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const source = "`:smile:` \\:smile: :smile:\n\n```\n:smile:\n```";

    expect(md.render(source)).toBe(
      "<p><code>:smile:</code> :smile: 😄</p>\n<pre><code>:smile:\n</code></pre>\n"
    );
  });
});
