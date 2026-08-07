import MarkdownIt from "markdown-it";
import { describe, expect, it, vi } from "vitest";

const vscode = vi.hoisted(() => {
  class MockUri {
    constructor(
      readonly scheme: string,
      readonly path: string,
      readonly query = "",
      readonly fragment = "",
      readonly authority = ""
    ) {}

    get fsPath(): string {
      return this.path;
    }

    toString(): string {
      return `${this.scheme}://${this.authority}${this.path}${this.query ? `?${this.query}` : ""}${this.fragment ? `#${this.fragment}` : ""}`;
    }

    with(change: { fragment?: string; query?: string }): MockUri {
      return new MockUri(
        this.scheme,
        this.path,
        change.query ?? this.query,
        change.fragment ?? this.fragment,
        this.authority
      );
    }
  }

  return {
    MockUri,
    Uri: {
      joinPath(base: MockUri, path: string): MockUri {
        return new MockUri(
          base.scheme,
          `${base.path.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
        );
      },
      parse(value: string): MockUri {
        const match = /^(.*?):(?:\/\/)?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/.exec(value);
        if (!match?.[1] || match[2] === undefined) throw new Error(`Invalid URI: ${value}`);
        return new MockUri(match[1], match[2], match[3], match[4]);
      }
    },
    workspace: {
      getWorkspaceFolder: () => ({ uri: new MockUri("file", "/workspace") })
    }
  };
});

vi.mock("vscode", () => ({ default: vscode }));

import githubImageUrl from "../../src/plugins/markdown-it-github-image-url";

describe("markdown-it-github-image-url", () => {
  it("rewrites absolute image path to relative in HTML img tag", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="/images/photo.png" alt="alt">');
    expect(html).toContain('src="./images/photo.png"');
  });

  it.each([
    ["root document", "/workspace/README.md"],
    ["nested document", "/workspace/docs/guide.md"]
  ])("resolves a project-root HTML image from a %s", (_case, documentPath) => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="/assets/logo.svg" alt="logo">', {
      currentDocument: new vscode.MockUri("file", documentPath),
      resourceProvider: {
        asWebviewUri(
          resource: InstanceType<typeof vscode.MockUri>
        ): InstanceType<typeof vscode.MockUri> {
          return new vscode.MockUri("https", resource.path, "", "", "webview.test");
        }
      }
    });

    expect(html).toContain('src="https://webview.test/workspace/assets/logo.svg"');
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
