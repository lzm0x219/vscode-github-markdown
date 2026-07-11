import { describe, expect, it } from "vitest";
import {
  githubCssFileNames,
  githubCssImports,
  renderThemeCss,
  splitThemeCss
} from "../../../scripts/build/github-css";

describe("GitHub CSS assets", () => {
  it("lists the shared stylesheet before stable theme files", () => {
    expect(githubCssFileNames()).toEqual([
      "github-markdown.css",
      "github-markdown-theme-light.css",
      "github-markdown-theme-light_colorblind.css",
      "github-markdown-theme-light_high_contrast.css",
      "github-markdown-theme-light_tritanopia.css",
      "github-markdown-theme-dark.css",
      "github-markdown-theme-dark_colorblind.css",
      "github-markdown-theme-dark_dimmed.css",
      "github-markdown-theme-dark_high_contrast.css",
      "github-markdown-theme-dark_tritanopia.css"
    ]);
  });

  it("renders imports for every generated asset", () => {
    expect(githubCssImports()).toMatch(/^@import "\.\/github-markdown\.css";/);
    expect(githubCssImports().split("\n")).toHaveLength(10);
  });

  it("splits shared variables from a theme block", () => {
    const css = `:root { --shared: value; }
.vscode-github-markdown,
[data-theme="light"] {
  --color: white;
}`;
    expect(splitThemeCss(css, "light")).toEqual({
      sharedVariables: ":root { --shared: value; }",
      themeVariables: "  --color: white;"
    });
  });

  it("rejects CSS without the expected theme selector", () => {
    expect(() => splitThemeCss(":root {}", "dark")).toThrow(
      "Cannot split generated CSS variables for theme dark"
    );
  });

  it("renders explicit and automatic color-mode selectors", () => {
    const css = renderThemeCss("dark", "  --color: black;");
    expect(css).toContain('[data-color-mode="light"][data-light-theme="dark"]');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain('[data-color-mode="auto"][data-dark-theme="dark"]');
  });
});
