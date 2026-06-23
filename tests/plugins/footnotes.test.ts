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
});
