import MarkdownIt from "markdown-it";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import packageJson from "../../package.json";
import githubAlerts from "../../src/plugins/markdown-it-github-alerts";
import githubEmoji from "../../src/plugins/markdown-it-github-emoji";
import githubFootnotes from "../../src/plugins/markdown-it-github-footnotes";
import githubTaskLists from "../../src/plugins/markdown-it-github-task-lists";

export function verifyGithubMarkdownPlugins(): void {
  const md = new MarkdownIt({ html: true })
    .use(githubTaskLists)
    .use(githubAlerts)
    .use(githubEmoji)
    .use(githubFootnotes);

  const taskListHtml = md.render(
    "- [x] #739\n- [ ] [https://github.com/octo-org/octo-repo/issues/740](https://github.com/octo-org/octo-repo/issues/740)\n"
  );
  assert.match(taskListHtml, /<ul class="contains-task-list">\n/);
  assert.doesNotMatch(taskListHtml, /contains-task-list contains-task-list/);
  assert.match(
    taskListHtml,
    /<li class="task-list-item"><input type="checkbox" id="" disabled="" class="task-list-item-checkbox" aria-label="Completed task" checked=""> #739<\/li>/
  );
  assert.match(
    taskListHtml,
    /<li class="task-list-item"><input type="checkbox" id="" disabled="" class="task-list-item-checkbox" aria-label="Incomplete task"> <a href="https:\/\/github.com\/octo-org\/octo-repo\/issues\/740">https:\/\/github.com\/octo-org\/octo-repo\/issues\/740<\/a><\/li>/
  );

  const footnotesHtml = md.render(
    "Here is a footnote[^1].\n\nHere is the same footnote[^1].\n\nAnother footnote[^2].\n\n[^1]: My *reference*.\n\n[^2]:\n    To add line breaks within a footnote, add 2 spaces to the end of a line.\n    This is a second line.\n"
  );
  assert.match(footnotesHtml, /class="footnote-ref"/);
  assert.match(footnotesHtml, /<section data-footnotes="" class="footnotes">/);
  assert.match(footnotesHtml, /<em>reference<\/em>/);
  assert.match(footnotesHtml, /class="data-footnote-backref">↩<\/a>/);
  assert.match(footnotesHtml, /class="data-footnote-backref">↩<sup>2<\/sup><\/a>/);
  assert.match(
    footnotesHtml,
    /To add line breaks within a footnote, add 2 spaces to the end of a line\.\nThis is a second line\./
  );

  const wrappedFootnotesHtml = new MarkdownIt({ html: true })
    .use(githubFootnotes)
    .use(markdownItRenderWrapper)
    .render("Here is a footnote[^1].\n\n[^1]: My *reference*.\n");
  assert.doesNotMatch(wrappedFootnotesHtml, /<li[^>]*>[\s\S]*vscode-github-markdown/);

  const alertHtml = md.render(
    "> [!NOTE]\n> Useful information that users should know, even when skimming content.\n"
  );
  assert.match(
    alertHtml,
    /<div class="markdown-alert markdown-alert-note" dir="auto">\n<p class="markdown-alert-title" dir="auto"><svg data-component="Octicon" class="octicon octicon-info mr-2"[^>]*>.*<\/svg>Note<\/p><p dir="auto">Useful information that users should know, even when skimming content\.<\/p>\n<\/div>/s
  );
  assert.doesNotMatch(alertHtml, /<blockquote|markdown-alert-body/);

  const emojiHtml = md.render("Ship it :rocket: :+1: :warning: :shipit: :artist: :unknown:\n");
  assert.match(emojiHtml, /Ship it 🚀 👍 ⚠️ <img class="emoji"/);
  assert.match(emojiHtml, /alt=":shipit:"/);
  assert.match(
    emojiHtml,
    /src="https:\/\/github.githubassets.com\/images\/icons\/emoji\/shipit\.png/
  );
  assert.match(emojiHtml, /alt=":artist:"/);
  assert.match(emojiHtml, /:unknown:/);

  const previewScript = readFileSync("src/extension.preview.ts", "utf8");
  assert.doesNotMatch(previewScript, /from "mermaid|mermaid\.render|mermaid\.initialize/);
  const dependencies = (packageJson as { dependencies?: Record<string, string> }).dependencies;
  assert.equal(Object.hasOwn(dependencies ?? {}, "mermaid"), false);

  const previewCss = readFileSync("src/extension.preview.css", "utf8");
  assert.match(previewCss, /\.vscode-github-markdown \.mermaid/);
  assert.match(previewCss, /\.vscode-github-markdown \.md-mermaid/);
  assert.match(previewCss, /--vscode-github-markdown-mermaid-bg: white/);
  assert.match(previewCss, /--vscode-github-markdown-mermaid-node-bg/);
  assert.match(previewCss, /--vscode-github-markdown-mermaid-node-bg: #ececff/);
  assert.match(previewCss, /--vscode-github-markdown-mermaid-node-border: #9370db/);
  assert.match(previewCss, /--vscode-github-markdown-mermaid-secondary-bg: #ffffde/);
  assert.match(previewCss, /--vscode-github-markdown-mermaid-note-bg: #fff5ad/);
  assert.match(previewCss, /\.vscode-github-markdown \.mermaid svg/);
  assert.match(previewCss, /\.vscode-github-markdown \.mermaid \.node/);
  assert.match(previewCss, /\.vscode-github-markdown \.mermaid \.edgePath/);
  assert.match(previewCss, /\.vscode-github-markdown \.mermaid \.cluster/);
  assert.match(previewCss, /\.actor/);
  assert.match(previewCss, /\.classTitle/);
  assert.match(previewCss, /\.state-title/);
  assert.match(previewCss, /\.task/);
  assert.match(previewCss, /\.pieCircle/);
  assert.match(previewCss, /\.radarAxisLine/);
  assert.match(previewCss, /\.treemapLeaf/);
  assert.match(previewCss, /\.venn-text-node/);
  assert.match(previewCss, /\.wardley-node-label/);
  assert.match(previewCss, /\.architecture-service/);
  assert.match(previewCss, /\[class\*="section-type-"\]/);
}

function markdownItRenderWrapper(md: MarkdownIt): MarkdownIt {
  const render = md.renderer.render.bind(md.renderer);

  md.renderer.render = function (...args) {
    return `<div class="vscode-github-markdown">${render.apply(md.renderer, args)}</div>`;
  };

  return md;
}
