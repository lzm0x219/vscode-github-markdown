import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderLocalMarkdown } from "../../../scripts/parity/local";
import { project } from "../../../scripts/shared/project";

vi.mock("vscode", () => ({ l10n: { t: (message: string) => message } }));

describe("local parity renderer", () => {
  it("preserves fenced-code languages and source text", () => {
    const markdown = readFileSync(
      join(project.root, "tests/fixtures/github-flavored-markdown/03-code-and-color.md"),
      "utf8"
    );
    const html = renderLocalMarkdown(markdown);

    for (const language of [
      "text",
      "typescript",
      "python",
      "ruby",
      "css",
      "json",
      "yaml",
      "diff",
      "bash"
    ]) {
      expect(html).toContain(`class="language-${language}"`);
    }
    expect(html).toContain("function greet(name: string): string {");
    expect(html).toContain("def fibonacci(n: int) -&gt; int:");
    expect(html).toContain("echo &quot;Hello from bash&quot;");
  });
});
