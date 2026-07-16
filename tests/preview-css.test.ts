import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readGithubCssAssets } from "../scripts/build/github-css";

const previewCss = readFileSync(new URL("../src/extension.preview.css", import.meta.url), "utf8");

describe("preview theme CSS", () => {
  it("defines every color token consumed by the shared GitHub CSS", async () => {
    const assets = await readGithubCssAssets();
    const sharedCss = assets.find(({ fileName }) => fileName === "github-markdown.css")?.content;
    expect(sharedCss).toBeDefined();

    const vscodeModeCss = extractCssBlock(
      previewCss,
      '.vscode-github-markdown[data-color-mode="vscode"]'
    );
    const consumedTokens = new Set(
      [...sharedCss!.matchAll(/var\(\s*(--[\w-]+)/g)]
        .map((match) => match[1]!)
        .filter(isGitHubColorToken)
    );
    const definedTokens = new Set(
      [...vscodeModeCss.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]!)
    );

    expect([...consumedTokens].filter((token) => !definedTokens.has(token)).sort()).toEqual([]);
  });

  it("maps VS Code mode to active workbench colors", () => {
    expect(previewCss).toContain('.vscode-github-markdown[data-color-mode="vscode"]');

    for (const token of [
      "--vscode-editor-background",
      "--vscode-editor-foreground",
      "--vscode-descriptionForeground",
      "--vscode-textLink-foreground",
      "--vscode-textSeparator-foreground",
      "--vscode-editor-selectionBackground",
      "--vscode-editorWarning-foreground",
      "--vscode-editorError-foreground",
      "--vscode-testing-iconPassed",
      "--vscode-focusBorder"
    ]) {
      expect(previewCss).toContain(token);
    }
  });

  it("keeps high-contrast foreground, links, and focus outlines readable", () => {
    expect(previewCss).toContain("body.vscode-high-contrast");
    expect(previewCss).toContain("body.vscode-high-contrast-light");
    expect(previewCss).toContain("--fgColor-default: var(--vscode-editor-foreground) !important");
    expect(previewCss).toContain("--fgColor-accent: var(--vscode-textLink-foreground) !important");
    expect(previewCss).toContain("outline: 2px solid var(--vscode-focusBorder) !important");
  });

  it("does not override Single mode in high-contrast themes", () => {
    const highContrastCss = extractCssBlock(previewCss, "body.vscode-high-contrast,");

    expect(highContrastCss).toContain('.vscode-github-markdown[data-color-mode="auto"]');
    expect(highContrastCss).toContain('.vscode-github-markdown[data-color-mode="vscode"]');
    expect(highContrastCss).not.toContain('.vscode-github-markdown[data-color-mode="light"]');
    expect(highContrastCss).not.toContain('.vscode-github-markdown[data-color-mode="dark"]');
  });
});

function isGitHubColorToken(token: string): boolean {
  return /^--(?:bgColor|borderColor|color-|fgColor|focus-|selection-)/.test(token);
}

function extractCssBlock(css: string, selector: string): string {
  const selectorStart = css.indexOf(selector);
  const blockStart = css.indexOf("{", selectorStart);
  if (selectorStart < 0 || blockStart < 0) {
    throw new Error(`CSS selector not found: ${selector}`);
  }

  let depth = 0;
  for (let index = blockStart; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) return css.slice(blockStart + 1, index);
  }

  throw new Error(`CSS block is not closed: ${selector}`);
}
