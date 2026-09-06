import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import githubAlerts from "../../src/plugins/markdown-it-github-alerts";

describe("markdown-it-github-alerts", () => {
  it("renders NOTE alert", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!NOTE]\n> Useful info.");
    expect(html).toContain("markdown-alert-note");
    expect(html).toContain("markdown-alert-title");
    expect(html).toContain("Note");
    expect(html).toContain("octicon-info");
  });

  it("renders TIP alert", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!TIP]\n> Helpful tip.");
    expect(html).toContain("markdown-alert-tip");
    expect(html).toContain("Tip");
    expect(html).toContain("octicon-light-bulb");
  });

  it("renders IMPORTANT alert", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!IMPORTANT]\n> Critical info.");
    expect(html).toContain("markdown-alert-important");
    expect(html).toContain("Important");
    expect(html).toContain("octicon-report");
  });

  it("renders WARNING alert", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!WARNING]\n> Be careful.");
    expect(html).toContain("markdown-alert-warning");
    expect(html).toContain("Warning");
    expect(html).toContain("octicon-alert");
  });

  it("renders CAUTION alert", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!CAUTION]\n> Dangerous.");
    expect(html).toContain("markdown-alert-caution");
    expect(html).toContain("Caution");
    expect(html).toContain("octicon-stop");
  });

  it("renders alert with lowercase marker", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!note]\n> Lowercase note.");
    expect(html).toContain("markdown-alert-note");
  });

  it("does not treat regular blockquote as alert", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> Regular quote.");
    expect(html).toContain("<blockquote>");
    expect(html).not.toContain("markdown-alert");
  });

  it("does not treat nested blockquotes as nested alerts", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> > Nested quote.");
    expect(html).toContain("<blockquote>");
    expect(html).not.toContain("markdown-alert");
  });

  it("does not render alerts inside list items", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("- > [!NOTE]\n  > List quote.");

    expect(html).toContain("<blockquote>");
    expect(html).toContain("[!NOTE]");
    expect(html).not.toContain("markdown-alert");
  });

  it("removes blockquote wrapper from alert output", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!NOTE]\n> Content.");
    expect(html).not.toContain("<blockquote");
  });

  it("keeps token-array work linear for many alerts", () => {
    const md = new MarkdownIt().use(githubAlerts);
    let tokenCount = 0;
    let indexedOperations = 0;
    md.core.ruler.before("github-markdown-alerts", "observe-token-work", (state) => {
      tokenCount = state.tokens.length;
      state.tokens = new Proxy(state.tokens, {
        get(target, key, receiver) {
          if (typeof key === "string" && /^\d+$/.test(key)) indexedOperations += 1;
          return Reflect.get(target, key, receiver);
        },
        set(target, key, value, receiver) {
          if (typeof key === "string" && /^\d+$/.test(key)) indexedOperations += 1;
          return Reflect.set(target, key, value, receiver);
        }
      });
    });

    const count = 300;
    const markdown = Array.from(
      { length: count },
      (_, index) => `> [!NOTE]\n> Note ${index}.`
    ).join("\n\n");
    const html = md.render(markdown);

    expect(html.match(/class="markdown-alert markdown-alert-note"/g)).toHaveLength(count);
    expect(html).toContain("Note 0.");
    expect(html).toContain(`Note ${count - 1}.`);
    // An operation budget verifies scaling without machine-dependent timings.
    expect(indexedOperations).toBeLessThan(tokenCount * 12);
  });

  it("preserves surrounding content, nested quotes, and source token metadata", () => {
    const md = new MarkdownIt().use(githubAlerts);
    let originalTokens: ReturnType<MarkdownIt["parse"]> = [];
    md.core.ruler.before("github-markdown-alerts", "capture-host-tokens", (state) => {
      originalTokens = [...state.tokens];
      for (const token of originalTokens) token.meta = { hostMarker: true };
    });
    const tokens = md.parse(
      "Before.\n\n> [!NOTE]\n> First.\n>\n> > Nested quote.\n>\n> Last.\n\nBetween.\n\n> [!TIP]\n> Second.\n\nAfter.",
      {}
    );
    expect(tokens.filter((token) => token.meta?.hostMarker)).toEqual(originalTokens);
    for (const token of originalTokens) expect(tokens).toContain(token);
    const html = md.renderer.render(tokens, md.options, {});
    expect(html).toMatch(
      /Before\.[\s\S]*markdown-alert-note[\s\S]*First\.[\s\S]*<blockquote>[\s\S]*Nested quote\.[\s\S]*<\/blockquote>[\s\S]*Last\.[\s\S]*Between\.[\s\S]*markdown-alert-tip[\s\S]*Second\.[\s\S]*After\./
    );
    expect(html.match(/class="markdown-alert-title"/g)).toHaveLength(2);
  });
});
