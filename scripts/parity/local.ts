import MarkdownIt from "markdown-it";
import alerts from "../../src/plugins/markdown-it-github-alerts";
import emoji from "../../src/plugins/markdown-it-github-emoji";
import footnotes from "../../src/plugins/markdown-it-github-footnotes";
import imageUrl from "../../src/plugins/markdown-it-github-image-url";
import taskLists from "../../src/plugins/markdown-it-github-task-lists";

export function renderLocalMarkdown(markdown: string): string {
  return new MarkdownIt({ html: true, linkify: true })
    .use(taskLists)
    .use(alerts)
    .use(emoji)
    .use(footnotes)
    .use(imageUrl)
    .render(markdown);
}
