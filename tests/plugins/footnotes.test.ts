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

  it("keeps single-word footnote definitions out of Markdown link references", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^a].\n\n[^a]: body");
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0];

    expect(html).toContain("data-footnote-ref");
    expect(footnote).toContain("body");
    expect(html).not.toContain('href="body"');
  });

  it("renders an empty footnote definition with its backreference", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^a].\n\n[^a]:");

    expect(html).toContain('<li id="user-content-fn-1">');
    expect(html).toContain("data-footnote-backref");
  });

  it("matches footnote labels without regard to case", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^foo].\n\n[^Foo]: Case-insensitive reference.");

    expect(html).toContain(
      '<a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a>'
    );
    expect(html).toContain("Case-insensitive reference.");
    expect(html).not.toContain("[^foo]");
  });

  it("uses Unicode case folding for footnote labels", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^straße].\n\n[^STRASSE]: Unicode case-folded reference.");

    expect(html).toContain("Unicode case-folded reference.");
    expect(html).not.toContain("[^straße]");
  });

  it("recognizes a footnote label that contains inline punctuation", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^a*b*].\n\n[^a*b*]: Punctuation label.");
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0];

    expect(html).toContain("data-footnote-ref");
    expect(footnote).toContain("Punctuation label.");
    expect(html).not.toContain("[^a");
  });

  it("keeps a footnote reference inside a Markdown link label", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("[link[^a]](https://example.com)\n\n[^a]: note body");

    expect(html).toContain(
      '<a href="https://example.com">link<sup></sup></a><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a>'
    );
    expect(html).toContain("note body");
    expect(html).not.toContain("[link");
  });

  it("recognizes an inline-punctuation label referenced by another footnote", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render(
      "Text[^outer].\n\n[^outer]: Nested[^a*b*].\n\n[^a*b*]: Punctuation label."
    );

    expect(html).toContain('href="#user-content-fn-2"');
    expect(html).toContain("Punctuation label.");
    expect(html).not.toContain("[^a");
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

  it("recognizes a footnote definition inside a list item", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Body[^a].\n\n- item\n  [^a]: list body\n");
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0];

    expect(html).toContain("data-footnote-ref");
    expect(html).toContain("<ul>\n<li>item</li>\n</ul>");
    expect(footnote).toContain("list body");
    expect(html).not.toContain("[^a]:");
  });

  it("keeps the first duplicate footnote definition", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render(
      "Text[^note].\n\n[^Note]: First definition.\n[^note]: Second definition."
    );

    expect(html).toContain("First definition.");
    expect(html).not.toContain("Second definition.");
  });

  it("renders multiple references to same footnote with backrefs", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("First[^1]. Second[^1].\n\n[^1]: Shared ref.");

    expect(html).toContain('id="user-content-fnref-1"');
    expect(html).toContain('id="user-content-fnref-1-2"');
    expect(html).toContain("data-footnote-backref");
    expect(html).toContain("<sup>2</sup>");
  });

  it("renders a large footnote index without leaking backreference state", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const count = 1_000;
    const references = Array.from({ length: count }, (_, index) => `note[^${index}]`).join(" ");
    const definitions = Array.from(
      { length: count },
      (_, index) => `[^${index}]: Definition ${index}.`
    ).join("\n");
    const environment: Record<string, unknown> = {};

    const html = md.render(`${references}\n\n${definitions}`, environment);

    expect(html.match(/data-footnote-backref=""/g)).toHaveLength(count);
    expect(environment).not.toHaveProperty("githubMarkdownFootnoteOrder");
    expect(environment).not.toHaveProperty("githubMarkdownFootnoteReferences");
  });

  it("renders inline markup in footnote definition", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^1].\n\n[^1]: My **bold** reference.");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("resolves document link references inside footnote definitions", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^1].\n\n[ref]: https://example.com\n\n[^1]: [link][ref]");
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0];

    expect(footnote).toContain('<a href="https://example.com">link</a>');
  });

  it("normalizes multiline footnote definitions", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^1].\n\n[^1]:\n    Line 1.\n    Line 2.");
    expect(html).toContain("Line 1.");
    expect(html).toContain("Line 2.");
  });

  it("keeps an adjacent continuation line in the same footnote paragraph", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Body[^a].\n\n[^a]: first line\n    second line\n");
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0] ?? "";

    expect(footnote).toContain("first line<br>\nsecond line");
    expect(footnote.match(/<p dir="auto">/g)).toHaveLength(1);
  });

  it("preserves soft breaks when a footnote starts on a continuation line", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Body[^a].\n\n[^a]:\n    first line\n    second line\n");
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0] ?? "";

    expect(footnote).toContain("first line\nsecond line");
    expect(footnote).not.toContain("<br>");
  });

  it("preserves indented code blocks inside a footnote", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^1].\n\n[^1]:\n        const value = 1;");
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0];

    expect(footnote).toContain("<pre><code>const value = 1;");
    expect(footnote).not.toContain("<p>const value = 1;");
  });

  it("places the backreference after a trailing code block", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render(
      "Text[^1].\n\n[^1]: Paragraph.\n\n    ```\n    const value = 1;\n    ```"
    );
    const footnote = html.match(/<li id="user-content-fn-1">[\s\S]*?<\/li>/)?.[0] ?? "";

    expect(footnote.indexOf("data-footnote-backref")).toBeGreaterThan(footnote.indexOf("</pre>"));
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

  it("does not collect footnote definitions from fenced code", () => {
    const md = new MarkdownIt().use(githubFootnotes);
    const html = md.render("Text[^a].\n\n```markdown\n[^a]: body\n```");

    expect(html).toContain("[^a]: body");
    expect(html).not.toContain("data-footnote-ref");
    expect(html).not.toContain('class="footnotes"');
  });
});
