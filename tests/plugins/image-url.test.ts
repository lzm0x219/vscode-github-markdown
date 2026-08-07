import MarkdownIt from "markdown-it";
import { describe, expect, it, vi } from "vitest";

const vscode = vi.hoisted(() => {
  class MockUri {
    constructor(
      readonly scheme: string,
      readonly path: string,
      readonly query = "",
      readonly fragment = "",
      readonly authority = "",
      readonly fsPath = path
    ) {}

    toString(): string {
      return `${this.scheme}://${this.authority}${this.path}${this.query ? `?${this.query}` : ""}${this.fragment ? `#${this.fragment}` : ""}`;
    }

    with(change: { fragment?: string; query?: string }): MockUri {
      return new MockUri(
        this.scheme,
        this.path,
        change.query ?? this.query,
        change.fragment ?? this.fragment,
        this.authority,
        this.fsPath
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
        const path = decodeURIComponent(match[2]);
        return new MockUri(match[1], path, match[3], match[4], "", path.replaceAll("/", "\\"));
      }
    },
    workspace: {
      getWorkspaceFolder: vi.fn(() => ({ uri: new MockUri("file", "/workspace") }))
    }
  };
});

vi.mock("vscode", () => ({ ...vscode, default: vscode }));

import githubImageUrl from "../../src/plugins/markdown-it-github-image-url";

function renderEnv(documentPath = "/workspace/README.md") {
  return {
    currentDocument: new vscode.MockUri("file", documentPath),
    resourceProvider: {
      asWebviewUri(
        resource: InstanceType<typeof vscode.MockUri>
      ): InstanceType<typeof vscode.MockUri> {
        return new vscode.MockUri(
          "https",
          resource.path,
          resource.query,
          resource.fragment,
          "webview.test"
        );
      }
    }
  };
}

describe("markdown-it-github-image-url", () => {
  it("rewrites absolute image path to relative in HTML img tag", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="/images/photo.png" alt="alt">');
    expect(html).toContain('src="./images/photo.png"');
  });

  it.each([
    ["root document", "/workspace/README.md"],
    ["nested document", "/workspace/docs/guide.md"]
  ])(
    "resolves a project-root HTML image from a %s using URI path semantics",
    (_case, documentPath) => {
      const md = new MarkdownIt({ html: true }).use(githubImageUrl);
      const html = md.render('<img src="/assets/logo.svg" alt="logo">', renderEnv(documentPath));

      expect(html).toContain('src="https://webview.test/workspace/assets/logo.svg"');
    }
  );

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
    expect(html).toBe('<img data-src=/lazy.png src="./actual.png" alt=logo>');
  });

  it("quotes a rewritten unquoted src when its URI contains a decoded space", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render(
      "<img src=/assets/my%20logo.svg alt=logo>",
      renderEnv("/workspace/docs/guide.md")
    );

    expect(html).toBe('<img src="https://webview.test/workspace/assets/my logo.svg" alt=logo>');
  });

  it("preserves a single-quoted src while escaping a decoded apostrophe", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render("<img src='/assets/author%27s-logo.svg' alt='logo'>", renderEnv());

    expect(html).toBe(
      "<img src='https://webview.test/workspace/assets/author&#39;s-logo.svg' alt='logo'>"
    );
  });

  it("preserves a double-quoted src while escaping a decoded quotation mark", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="/assets/%22logo%22.svg" alt="logo">', renderEnv());

    expect(html).toBe(
      '<img src="https://webview.test/workspace/assets/&quot;logo&quot;.svg" alt="logo">'
    );
  });

  it("preserves query and fragment components in a serialized src", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render(
      '<img src="/assets/logo.svg?theme=light&size=wide#hero" alt=logo>',
      renderEnv()
    );

    expect(html).toBe(
      '<img src="https://webview.test/workspace/assets/logo.svg?theme=light&amp;size=wide#hero" alt=logo>'
    );
  });

  it("decodes existing HTML entities without applying Markdown backslash escapes", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render(
      '<img src="/assets/a\\&amp;b.svg?theme=light&amp;size=wide#hero" alt=logo>',
      renderEnv()
    );

    expect(html).toBe(
      '<img src="https://webview.test/workspace/assets/a\\&amp;b.svg?theme=light&amp;size=wide#hero" alt=logo>'
    );
  });

  it("preserves browser semantics for a legacy entity without a semicolon", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="/assets/a&amp?theme=light#hero" alt=logo>', renderEnv());

    expect(html).toBe(
      '<img src="https://webview.test/workspace/assets/a&amp;?theme=light#hero" alt=logo>'
    );
  });

  it("serializes an unquoted src against the owning folder in a multi-root workspace", () => {
    vscode.workspace.getWorkspaceFolder.mockReturnValueOnce({
      uri: new vscode.MockUri("file", "/second-workspace")
    });
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render(
      "<img src=/assets/my%20logo.svg alt=logo>",
      renderEnv("/second-workspace/docs/guide.md")
    );

    expect(html).toBe(
      '<img src="https://webview.test/second-workspace/assets/my logo.svg" alt=logo>'
    );
  });

  it("serializes the relative fallback when URI parsing fails", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render("<img src=/assets/bad%ZZ.svg alt=logo>", renderEnv());

    expect(html).toBe('<img src="./assets/bad%ZZ.svg" alt=logo>');
  });

  it("preserves protocol-relative image URLs", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render('<img src="//cdn.example.com/a.png">');
    expect(html).toBe('<img src="//cdn.example.com/a.png">');
  });

  it("preserves unquoted protocol-relative image URLs", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render("<img src=//cdn.example.com/a.png>");
    expect(html).toBe("<img src=//cdn.example.com/a.png>");
  });

  it("preserves an unquoted remote image URL", () => {
    const md = new MarkdownIt({ html: true }).use(githubImageUrl);
    const html = md.render("<img src=https://example.com/a.png alt=logo>");
    expect(html).toBe("<img src=https://example.com/a.png alt=logo>");
  });
});
