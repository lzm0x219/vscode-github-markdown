import { $ } from "bun";
import MarkdownIt from "markdown-it";
import assert from "node:assert/strict";
import githubAlerts from "../src/plugins/markdown-it-github-alerts";
import githubFootnotes from "../src/plugins/markdown-it-github-footnotes";
import githubTaskLists from "../src/plugins/markdown-it-github-task-lists";

const md = new MarkdownIt({ html: true })
  .use(githubTaskLists)
  .use(githubAlerts)
  .use(githubFootnotes);

const taskListHtml = md.render("- [x] done\n- [ ] todo\n");
assert.match(taskListHtml, /contains-task-list/);
assert.match(taskListHtml, /task-list-item-checkbox/);
assert.match(taskListHtml, /checked disabled/);

const footnotesHtml = md.render("Here is a footnote[^1].\n\n[^1]: My *reference*.\n");
assert.match(footnotesHtml, /class="footnote-ref"/);
assert.match(footnotesHtml, /<section class="footnotes"/);
assert.match(footnotesHtml, /<em>reference<\/em>/);

const alertHtml = md.render("> [!WARNING]\n> Watch out.\n");
assert.match(alertHtml, /markdown-alert markdown-alert-warning/);
assert.match(alertHtml, /markdown-alert-title">Warning</);
assert.match(alertHtml, /Watch out\./);

await $`printf '%s\n' \
  "Verified GitHub Markdown task lists, footnotes, and alerts." \
  "" \
  "For visual comparison, open test/fixtures/github-flavored-markdown-checklist.md in VS Code" \
  "and compare the preview with https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown-checklist.md" \
  ""`;
