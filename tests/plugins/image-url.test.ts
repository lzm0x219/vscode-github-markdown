import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import githubImageUrl from "../../src/plugins/markdown-it-github-image-url";

describe("markdown-it-github-image-url", () => {
  it("rewrites absolute image path to relative in HTML img tag", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="/images/photo.png" alt="alt">');
    expect(html).toContain('src="./images/photo.png"');
  });

  it("does not touch already-relative paths", () => {
    const md = new MarkdownIt().use(githubImageUrl);
    const html = md.render("![alt](./images/photo.png)");
    expect(html).toContain('src="./images/photo.png"');
  });

  it("does not touch external URLs", () => {
    const md = new MarkdownIt().use(githubImageUrl);
    const html = md.render("![alt](https://example.com/img.png)");
    expect(html).toContain('src="https://example.com/img.png"');
  });

  it("rewrites HTML img tags with absolute paths", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="/assets/logo.svg" alt="logo">');
    expect(html).toContain(`src="./assets/logo.svg"`);
  });

  it("rewrites only the src attribute on raw HTML images", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img data-src="/lazy.png" src="/actual.png">');
    expect(html).toContain('data-src="/lazy.png" src="./actual.png"');
  });

  it("rewrites an unquoted project-root src attribute", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render("<img data-src=/lazy.png src=/actual.png alt=logo>");
    expect(html).toContain("data-src=/lazy.png src=./actual.png alt=logo");
  });

  it("preserves protocol-relative image URLs", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="//cdn.example.com/a.png">');
    expect(html).toContain('src="//cdn.example.com/a.png"');
  });

  it("preserves unquoted protocol-relative image URLs", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render("<img src=//cdn.example.com/a.png>");
    expect(html).toContain("src=//cdn.example.com/a.png");
  });
});
