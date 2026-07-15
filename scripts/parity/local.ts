import MarkdownIt from "markdown-it";
import alerts from "../../src/plugins/markdown-it-github-alerts";
import directionality from "../../src/plugins/markdown-it-github-directionality";
import emoji from "../../src/plugins/markdown-it-github-emoji";
import footnotes from "../../src/plugins/markdown-it-github-footnotes";
import imageUrl from "../../src/plugins/markdown-it-github-image-url";
import strikethrough from "../../src/plugins/markdown-it-github-strikethrough";
import tagfilter from "../../src/plugins/markdown-it-github-tagfilter";
import taskLists from "../../src/plugins/markdown-it-github-task-lists";

export function renderLocalMarkdown(markdown: string): string {
  return new MarkdownIt({ html: true, linkify: true })
    .use(strikethrough)
    .use(tagfilter)
    .use(taskLists)
    .use(alerts)
    .use(emoji)
    .use(footnotes)
    .use(directionality)
    .use(imageUrl)
    .render(markdown);
}
