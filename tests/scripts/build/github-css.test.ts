import { describe, expect, it, vi } from "vitest";
import {
  generateGithubCssAssets,
  githubCssFileNames,
  githubCssImports,
  readGithubCssAssets,
  renderThemeCss,
  splitThemeCss,
  type GithubCssGenerator
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

  it("loads every build asset from the committed parity reference", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network disabled"));

    const assets = await readGithubCssAssets();

    expect(assets.map(({ fileName }) => fileName)).toEqual(githubCssFileNames());
    expect(assets.every(({ content }) => content.includes(".vscode-github-markdown"))).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("generates fixture styles once before generating theme variables without fixtures", async () => {
    const calls: Parameters<GithubCssGenerator>[0][] = [];
    const generator = vi.fn<GithubCssGenerator>(async (options) => {
      calls.push(options);
      if (options["onlyStyles"]) return ".vscode-github-markdown { color: inherit; }";
      const theme = String(options["light"]);
      return `:root { --shared: value; }
.vscode-github-markdown,
[data-theme="${theme}"] {
  --color: ${theme};
}`;
    });

    await generateGithubCssAssets(generator);

    expect(calls).toHaveLength(10);
    expect(calls[0]).toMatchObject({ onlyStyles: true, rootSelector: ".vscode-github-markdown" });
    expect(calls.slice(1).every((options) => options.useFixture === false)).toBe(true);
  });

  it("authenticates GitHub API requests made during explicit CSS generation", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn<
      (input: string | URL | Request, init?: RequestInit) => Promise<Response>
    >(async () => new Response("", { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const generator = vi.fn<GithubCssGenerator>(async (options) => {
      if (options.onlyStyles) {
        await globalThis.fetch("https://api.github.com/markdown", {
          headers: { Accept: "application/vnd.github+json" }
        });
        return ".vscode-github-markdown { color: inherit; }";
      }
      const theme = String(options.light);
      return `:root { --shared: value; }
.vscode-github-markdown,
[data-theme="${theme}"] {
  --color: ${theme};
}`;
    });

    try {
      await generateGithubCssAssets(generator, "test-token");

      const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-token");
      expect(globalThis.fetch).toBe(fetchMock);
    } finally {
      globalThis.fetch = originalFetch;
    }
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
