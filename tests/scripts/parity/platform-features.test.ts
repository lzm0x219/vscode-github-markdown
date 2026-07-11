import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderLocalMarkdown } from "../../../scripts/parity/local";
import { project } from "../../../scripts/shared/project";

vi.mock("vscode", () => ({ l10n: { t: (message: string) => message } }));

describe("GitHub platform feature fallbacks", () => {
  it("preserves every enhanced-renderer source block for the VS Code host", () => {
    const markdown = readFileSync(
      join(project.root, "tests/fixtures/github-flavored-markdown/11-github-platform-features.md"),
      "utf8"
    );
    const html = renderLocalMarkdown(markdown);

    expect(html.match(/class="language-mermaid"/g)).toHaveLength(18);
    expect(html.match(/class="language-geojson"/g)).toHaveLength(1);
    expect(html.match(/class="language-topojson"/g)).toHaveLength(1);
    expect(html.match(/class="language-stl"/g)).toHaveLength(1);
    expect(html.match(/class="language-math"/g)).toHaveLength(2);
    expect(html).toContain("flowchart TD");
    expect(html).toContain("&quot;type&quot;: &quot;FeatureCollection&quot;");
    expect(html).toContain("solid cube_corner");
    expect(html).toContain("\\begin{pmatrix}");
  });
});
