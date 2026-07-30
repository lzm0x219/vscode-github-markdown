import MarkdownIt from "markdown-it";
import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  default: {
    l10n: {
      t: (key: string, ...args: (string | number)[]) => {
        return args.length > 0
          ? key.replace(/\{(\d+)\}/g, (_m, i) => String(args[Number(i)] ?? ""))
          : key;
      }
    }
  },
  l10n: {
    t: (key: string, ...args: (string | number)[]) => {
      return args.length > 0
        ? key.replace(/\{(\d+)\}/g, (_m, i) => String(args[Number(i)] ?? ""))
        : key;
    }
  }
}));

import githubFootnotes from "../../src/plugins/markdown-it-github-footnotes";

describe("markdown-it-github-footnotes", () => {
  it("renders footnote reference", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^1].\n\n[^1]: My reference.");
    expect(html).toContain("footnote-ref");
    expect(html).toContain('href="#user-content-fn-1"');
    expect(html).toContain("footnotes");
    expect(html).toContain("My reference.");
  });

  it("renders multiple footnotes with correct numbering", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("A[^1]. B[^2].\n\n[^1]: Ref A.\n\n[^2]: Ref B.");
    expect(html).toContain('href="#user-content-fn-1"');
    expect(html).toContain('href="#user-content-fn-2"');
  });

  it("resolves a footnote referenced from another footnote definition", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Body[^a].\n\n[^a]: See note[^b].\n\n[^b]: Nested note.");
    const footnoteA = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0];
    const footnoteB = html.match(/<li id="user-content-fn-2">[\s\S]*?<\/li>/)?.[0];

    expect(html).toContain(
      '<a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a>'
    );
    expect(footnoteA).toContain(
      '<a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a>'
    );
    expect(footnoteA).toContain("See note");
    expect(footnoteA).toContain(
      'href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1"'
    );
    expect(footnoteB).toContain("Nested note.");
    expect(footnoteB).toContain(
      'href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2"'
    );
    expect(html).not.toContain("[^b]");
  });

  it("parses consecutive footnote definitions as separate notes", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render(
      "First[^first]. Second[^second].\n\n[^first]: First note.\n[^second]: Second note."
    );

    expect(html).toContain('<li id="user-content-fn-1">');
    expect(html).toContain('<li id="user-content-fn-2">');
    expect(html).not.toContain("[^second]:");
  });

  it("renders multiple references to same footnote with backrefs", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("First[^1]. Second[^1].\n\n[^1]: Shared ref.");
    // Two references to the same footnote
    const referenceCount = (html.match(/fnref-1/g) ?? []).length;
    expect(referenceCount).toBeGreaterThanOrEqual(2);
    // Backreference with sup
    expect(html).toContain("data-footnote-backref");
  });

  it("renders inline markup in footnote definition", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^1].\n\n[^1]: My **bold** reference.");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("normalizes multiline footnote definitions", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^1].\n\n[^1]:\n    Line 1.\n    Line 2.");
    expect(html).toContain("Line 1.");
    expect(html).toContain("Line 2.");
  });

  it("keeps indented paragraphs inside the footnote", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render(
      "Text[^1].\n\n[^1]: First paragraph.\n\n    Second paragraph with **bold**."
    );
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0];

    expect(footnote).toContain('<p dir="auto">First paragraph.</p>');
    expect(footnote).toContain('<p dir="auto">Second paragraph with <strong>bold</strong>.');
    expect(html).not.toContain("<pre><code>Second paragraph");
  });

  it("ignores undefined footnotes in text", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^undefined].");
    // Should not contain footnote section since no definitions
    expect(html).not.toContain("footnotes");
    // The reference should remain as plain text (or be untouched)
    expect(html).toContain("[^undefined]");
  });

  it("does not add footnote section when no definitions exist", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Plain text without any note.");
    expect(html).not.toContain('class="footnotes"');
  });

  it("keeps escaped footnote references as literal text", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text\\[^1].\n\n[^1]: My reference.");

    expect(html).toContain("Text[^1].");
    expect(html).not.toContain("data-footnote-ref");
    expect(html).not.toContain('class="footnotes"');
    expect(html).not.toContain("My reference.");
  });
});
