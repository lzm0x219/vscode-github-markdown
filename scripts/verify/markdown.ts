import MarkdownIt from "markdown-it";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import githubAlerts from "../../src/plugins/markdown-it-github-alerts";
import githubEmoji from "../../src/plugins/markdown-it-github-emoji";
import githubFootnotes from "../../src/plugins/markdown-it-github-footnotes";
import githubStrikethrough from "../../src/plugins/markdown-it-github-strikethrough";
import githubTaskLists from "../../src/plugins/markdown-it-github-task-lists";
import { project } from "../shared/project";

export function verifyMarkdownCompatibility(): void {
  const markdown = new MarkdownIt({ html: true })
    .use(githubStrikethrough)
    .use(githubTaskLists)
    .use(githubAlerts)
    .use(githubEmoji)
    .use(githubFootnotes);

  verifyTaskLists(markdown);
  verifyFootnotes(markdown);
  verifyAlerts(markdown);
  verifyEmoji(markdown);
  verifyStrikethrough(markdown);
  verifyMermaidBoundary();
}

function verifyStrikethrough(markdown: MarkdownIt): void {
  const html = markdown.render(
    "~~Hi~~ Hello, ~there~ world!\n\n\\~escaped\\~ `~code~` ~~ ~open ~~~not~~~\n"
  );
  assert.match(
    html,
    /<s>Hi<\/s> Hello, <del>there<\/del> world!/,
    "single-tilde strikethrough and existing double-tilde markup"
  );
  assert.match(
    html,
    /~escaped~ <code>~code~<\/code> ~~ ~open ~~~not~~~/,
    "literal escaped, code-span, empty, unmatched, and long tilde sequences"
  );
}

function verifyTaskLists(markdown: MarkdownIt): void {
  const html = markdown.render(
    "- [x] #739\n- [ ] [https://github.com/octo-org/octo-repo/issues/740](https://github.com/octo-org/octo-repo/issues/740)\n"
  );
  assert.match(html, /<ul class="contains-task-list">\n/, "task list container class");
  assert.doesNotMatch(html, /contains-task-list contains-task-list/, "duplicate task list class");
  assert.match(
    html,
    /<li class="task-list-item"><input type="checkbox" id="" disabled="" class="task-list-item-checkbox" aria-label="Completed task" checked=""> #739<\/li>/,
    "completed task item"
  );
  assert.match(html, /aria-label="Incomplete task"> <a href=/, "incomplete linked task item");
}

function verifyFootnotes(markdown: MarkdownIt): void {
  const html = markdown.render(
    "Here is a footnote[^1].\n\nHere is the same footnote[^1].\n\nAnother footnote[^2].\n\n[^1]: My *reference*.\n\n[^2]:\n    To add line breaks within a footnote, add 2 spaces to the end of a line.\n    This is a second line.\n"
  );
  assert.match(html, /class="footnote-ref"/, "footnote reference");
  assert.match(html, /<section data-footnotes="" class="footnotes">/, "footnote section");
  assert.match(html, /<em>reference<\/em>/, "Markdown inside footnote");
  assert.match(html, /class="data-footnote-backref">↩<\/a>/, "first back reference");
  assert.match(html, /class="data-footnote-backref">↩<sup>2<\/sup><\/a>/, "second back reference");
  assert.match(
    html,
    /To add line breaks within a footnote, add 2 spaces to the end of a line\.\nThis is a second line\./,
    "multiline footnote"
  );

  const wrapped = new MarkdownIt({ html: true })
    .use(githubFootnotes)
    .use(wrapRender)
    .render("Here is a footnote[^1].\n\n[^1]: My *reference*.\n");
  assert.doesNotMatch(wrapped, /<li[^>]*>[\s\S]*vscode-github-markdown/, "wrapped footnotes");
}

function verifyAlerts(markdown: MarkdownIt): void {
  const html = markdown.render(
    "> [!NOTE]\n> Useful information that users should know, even when skimming content.\n"
  );
  assert.match(html, /class="markdown-alert markdown-alert-note"/, "note alert");
  assert.match(html, /class="markdown-alert-title"/, "alert title");
  assert.doesNotMatch(html, /<blockquote|markdown-alert-body/, "GitHub-compatible alert structure");
}

function verifyEmoji(markdown: MarkdownIt): void {
  const html = markdown.render("Ship it :rocket: :+1: :warning: :shipit: :artist: :unknown:\n");
  assert.match(
    html,
    /Ship it 🚀 👍 <g-emoji class="g-emoji" alias="warning">⚠️<\/g-emoji> <img class="emoji"/,
    "Unicode and image emoji"
  );
  assert.match(html, /alt=":shipit:"/, "shipit image emoji");
  assert.match(html, /github\.githubassets\.com\/images\/icons\/emoji\/shipit\.png/, "emoji URL");
  assert.match(html, /alt=":artist:"/, "artist image emoji");
  assert.match(html, /:unknown:/, "unknown emoji alias");
}

function verifyMermaidBoundary(): void {
  const packageJson = JSON.parse(readFileSync(project.paths.packageJson, "utf8")) as {
    dependencies?: Record<string, string>;
    contributes?: { "markdown.previewScripts"?: string[] };
  };
  assert.equal(
    packageJson.contributes?.["markdown.previewScripts"],
    undefined,
    "package must not contribute a Mermaid preview runtime"
  );
  assert.equal(
    Object.hasOwn(packageJson.dependencies ?? {}, "mermaid"),
    false,
    "package must not depend on Mermaid"
  );
}

function wrapRender(markdown: MarkdownIt): MarkdownIt {
  const render = markdown.renderer.render.bind(markdown.renderer);
  markdown.renderer.render = (...args) =>
    `<div class="vscode-github-markdown">${render(...args)}</div>`;
  return markdown;
}
