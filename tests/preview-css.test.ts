import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const previewCss = readFileSync(new URL("../src/extension.preview.css", import.meta.url), "utf8");

describe("preview theme CSS", () => {
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
});
