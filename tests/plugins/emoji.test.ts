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

  it("renders custom image emoji", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":shipit:");
    expect(html).toContain('<img class="emoji"');
    expect(html).toContain('alt=":shipit:"');
    expect(html).toContain("github.githubassets.com/images/icons/emoji/shipit.png");
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

  it("renders warning emoji as Unicode", () => {
    const md = new MarkdownIt().use(githubEmoji);
    const html = md.render(":warning:");
    expect(html).toContain("⚠️");
  });
});
