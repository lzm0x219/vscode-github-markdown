import MarkdownIt from "markdown-it";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  default: {
    workspace: {
      getConfiguration: () => ({
        get: (key: string, defaultValue?: unknown) => {
          const config: Record<string, unknown> = {
            "theme.mode": "system",
            "theme.single": "light",
            "theme.light": "light",
            "theme.dark": "dark"
          };
          return key in config ? config[key] : defaultValue;
        },
        update: async () => {}
      })
    }
  },
  l10n: {
    t: (key: string, ...args: (string | number)[]) => {
      return args.length > 0
        ? key.replace(/\{(\d+)\}/g, (_m, i) => String(args[Number(i)] ?? ""))
        : key;
    }
  }
}));

import alerts from "../../src/plugins/markdown-it-github-alerts";
import emoji from "../../src/plugins/markdown-it-github-emoji";
import footnotes from "../../src/plugins/markdown-it-github-footnotes";
import imageUrl from "../../src/plugins/markdown-it-github-image-url";
import strikethrough from "../../src/plugins/markdown-it-github-strikethrough";
import tagfilter from "../../src/plugins/markdown-it-github-tagfilter";
import taskLists from "../../src/plugins/markdown-it-github-task-lists";
import theme from "../../src/plugins/markdown-it-github-theme";

function createChain(): MarkdownIt {
  return new MarkdownIt({ html: true })
    .use(strikethrough)
    .use(tagfilter)
    .use(taskLists)
    .use(alerts)
    .use(emoji)
    .use(footnotes)
    .use(theme)
    .use(imageUrl);
}

describe("plugin chain integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders task list and alert in same document", () => {
    const md = createChain();
    const html = md.render("- [x] Done\n\n> [!NOTE]\n> Info.");
    expect(html).toContain("vscode-github-markdown");
    expect(html).toContain("task-list-item-checkbox");
    expect(html).toContain("markdown-alert-note");
  });

  it("renders emoji inside a footnote definition", () => {
    const md = createChain();
    const html = md.render("Ref[^1].\n\n[^1]: :rocket: Launch!");
    expect(html).toContain("🚀");
    expect(html).toContain("footnote-ref");
  });

  it("renders emoji inside an alert", () => {
    const md = createChain();
    const html = md.render("> [!TIP]\n> Use :rocket: for speed.");
    expect(html).toContain("markdown-alert-tip");
    expect(html).toContain("🚀");
  });

  it("footnote references work correctly through full plugin chain", () => {
    const md = createChain();
    const html = md.render(
      "Ref[^1] and another[^2].\n\n[^1]: First footnote.\n\n[^2]: Second footnote."
    );
    // Each footnote should have its own number
    expect(html).toContain('id="user-content-fn-1"');
    expect(html).toContain('id="user-content-fn-2"');
    expect(html).toContain("First footnote.");
    expect(html).toContain("Second footnote.");
  });

  it("idempotent: re-rendering same input produces same output", () => {
    const input =
      "- [x] Task\n\n> [!WARNING]\n> :warning: Danger.\n\nFootnote[^1].\n\n[^1]: Details.";
    const md1 = createChain();
    const md2 = createChain();
    expect(md1.render(input)).toBe(md2.render(input));
  });

  it("wraps final output in theme container", () => {
    const md = createChain();
    const html = md.render("# Hello\n\n- [ ] Item\n\n> [!NOTE]\n> Note.");
    // Theme wrapper should be outermost (tag may span multiple lines)
    expect(html).toContain('class="vscode-github-markdown"');
    // The theme div opens before the heading and closes at the very end
    const divOpen = html.indexOf("vscode-github-markdown");
    const h1Pos = html.indexOf("<h1>");
    expect(divOpen).toBeLessThan(h1Pos);
  });

  it("rewrites absolute HTML img paths after theme wrapping", () => {
    const md = createChain();
    const html = md.render('<img src="/assets/logo.png" alt="logo">');
    expect(html).toContain('src="./assets/logo.png"');
    expect(html).toContain("vscode-github-markdown");
  });

  it("handles complex nested structure", () => {
    const md = createChain();
    const html = md.render(
      [
        "# Document",
        "",
        "- [x] Task :rocket:",
        "- [ ] Pending",
        "",
        "> [!IMPORTANT]",
        "> See footnote[^1].",
        "",
        "[^1]: :warning: Warning."
      ].join("\n")
    );
    // All features present
    expect(html).toContain("vscode-github-markdown");
    expect(html).toContain("checked=");
    expect(html).toContain("🚀");
    expect(html).toContain("markdown-alert-important");
    expect(html).toContain("footnote-ref");
    expect(html).toContain("⚠️");
  });
});
