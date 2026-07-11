import MarkdownIt from "markdown-it";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { config } = vi.hoisted(() => ({
  config: {
    "theme.mode": "system",
    "theme.single": "light",
    "theme.light": "light",
    "theme.dark": "dark",
    "accessibility.linkUnderlines": true
  } as Record<string, unknown>
}));

// Mock vscode module before importing theme plugin
vi.mock("vscode", () => ({
  default: {
    workspace: {
      getConfiguration: () => ({
        get: (key: string, defaultValue?: unknown) => {
          return key in config ? config[key] : defaultValue;
        },
        update: async () => {}
      })
    }
  }
}));

import githubTheme from "../../src/plugins/markdown-it-github-theme";

describe("markdown-it-github-theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config["accessibility.linkUnderlines"] = true;
  });

  it("wraps rendered output in theme container div", () => {
    const md = new MarkdownIt().use(githubTheme);
    const html = md.render("Hello world");
    expect(html).toContain('class="vscode-github-markdown"');
    expect(html).toContain("data-color-mode");
    expect(html).toContain("data-light-theme");
    expect(html).toContain("data-dark-theme");
    expect(html).toContain('data-link-underlines="true"');
    expect(html).toContain("<p>Hello world</p>");
  });

  it("marks the preview when link underlines are disabled", () => {
    config["accessibility.linkUnderlines"] = false;
    const html = new MarkdownIt().use(githubTheme).render("[Link](https://example.com)");

    expect(html).toContain('data-link-underlines="false"');
  });

  it("wraps complex markdown content", () => {
    const md = new MarkdownIt().use(githubTheme);
    const html = md.render("# Heading\n\nParagraph with **bold**.");
    expect(html).toContain('class="vscode-github-markdown"');
    expect(html).toContain("<h1>Heading</h1>");
  });
});
