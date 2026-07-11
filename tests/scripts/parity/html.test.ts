import { describe, expect, it } from "vitest";
import { stripPlatformWrapperMarkup, stripSyntaxTokenMarkup } from "../../../scripts/parity/html";

describe("visual parity HTML normalization", () => {
  it("removes syntax token wrappers without changing code text", () => {
    expect(
      stripSyntaxTokenMarkup(
        '<pre><code><span class="pl-k">const</span> value = <span class="pl-s">"ok"</span>;</code></pre>'
      )
    ).toBe('<pre><code>const value = "ok";</code></pre>');
  });

  it("keeps non-syntax spans outside code blocks", () => {
    const html =
      '<p><span class="label">Stable</span></p><pre><code><span class="pl-k">const</span></code></pre>';
    expect(stripSyntaxTokenMarkup(html)).toBe(
      '<p><span class="label">Stable</span></p><pre><code>const</code></pre>'
    );
  });

  it("removes nested GitHub syntax spans from pre blocks without code wrappers", () => {
    expect(
      stripSyntaxTokenMarkup(
        '<pre><span class="pl-s">`Hello <span class="pl-s1">name</span>`</span></pre>'
      )
    ).toBe("<pre>`Hello name`</pre>");
  });
});

describe("visual parity platform wrapper normalization", () => {
  it("removes GitHub's layout-neutral accessibility table wrapper", () => {
    expect(
      stripPlatformWrapperMarkup(
        "<markdown-accessiblity-table><table><tr><td>Cell</td></tr></table></markdown-accessiblity-table>"
      )
    ).toBe("<table><tr><td>Cell</td></tr></table>");
  });
});
