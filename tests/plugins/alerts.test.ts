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

  it("removes blockquote wrapper from alert output", () => {
    const md = new MarkdownIt().use(githubAlerts);
    const html = md.render("> [!NOTE]\n> Content.");
    expect(html).not.toContain("<blockquote");
  });
});
