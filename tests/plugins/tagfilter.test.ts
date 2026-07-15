import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import tagfilter from "../../src/plugins/markdown-it-github-tagfilter";

const disallowedTags = [
  "title",
  "textarea",
  "style",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "script",
  "plaintext"
] as const;

function render(markdown: string): string {
  return new MarkdownIt({ html: true }).use(tagfilter).render(markdown);
}

describe("markdown-it-github-tagfilter", () => {
  it("matches the GFM tagfilter example", () => {
    const html = render(
      "<strong> <title> <style> <em>\n\n<blockquote>\n  <xmp> is disallowed.  <XMP> is also disallowed.\n</blockquote>\n"
    );

    expect(html).toContain("<strong> &lt;title> &lt;style> <em>");
    expect(html).toContain("&lt;xmp> is disallowed.  &lt;XMP> is also disallowed.");
  });

  it.each(disallowedTags)("filters mixed-case %s tags with attributes", (tag) => {
    const uppercaseTag = tag.toUpperCase();
    const html = render(
      `before <${uppercaseTag} data-case="mixed">content</${uppercaseTag}> after\n`
    );

    expect(html).toContain(`&lt;${uppercaseTag} data-case="mixed">content&lt;/${uppercaseTag}>`);
  });

  it("leaves allowed and similarly prefixed HTML tags unchanged", () => {
    const html = render(
      "<strong>strong</strong> <details>details</details> <picture>picture</picture> <scripture>custom</scripture> <style-guide>custom</style-guide>\n"
    );

    expect(html).toContain("<strong>strong</strong>");
    expect(html).toContain("<details>details</details>");
    expect(html).toContain("<picture>picture</picture>");
    expect(html).toContain("<scripture>custom</scripture>");
    expect(html).toContain("<style-guide>custom</style-guide>");
  });

  it("leaves code spans, fenced code, and escaped input literal", () => {
    const html = render(
      "`<script>inline</script>`\n\n\\<iframe>escaped\\</iframe>\n\n```html\n<style>fenced</style>\n```\n"
    );

    expect(html).toContain("<code>&lt;script&gt;inline&lt;/script&gt;</code>");
    expect(html).toContain("&lt;iframe&gt;escaped&lt;/iframe&gt;");
    expect(html).toContain("&lt;style&gt;fenced&lt;/style&gt;");
  });
});
