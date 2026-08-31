import { l10n } from "vscode";
import type MarkdownIt from "markdown-it";
import type { MarkdownToken, MarkdownState } from "./shared";

const taskListMarkerPattern = /^[ \t]*\[( |x|X)\][ \t]+/;
type HtmlEscaper = (value: string) => string;

export default function markdownItGitHubTaskLists(md: MarkdownIt): MarkdownIt {
  md.core.ruler.after("inline", "github-markdown-task-lists", (state) => {
    applyTaskLists(state as unknown as MarkdownState, md.utils.escapeHtml);
  });

  return md;
}

function applyTaskLists(state: MarkdownState, escapeHtml: HtmlEscaper) {
  const openLists = new Map<number, MarkdownToken>();

  for (let index = 0; index < state.tokens.length; index += 1) {
    const listItemOpen = state.tokens[index];
    if (listItemOpen?.type === "bullet_list_open" || listItemOpen?.type === "ordered_list_open") {
      openLists.set(listItemOpen.level, listItemOpen);
      continue;
    }
    if (listItemOpen?.type === "bullet_list_close" || listItemOpen?.type === "ordered_list_close") {
      openLists.delete(listItemOpen.level);
      continue;
    }

    const paragraphOpen = state.tokens[index + 1];
    const inline = state.tokens[index + 2];
    const paragraphClose = state.tokens[index + 3];

    if (
      listItemOpen?.type !== "list_item_open" ||
      paragraphOpen?.type !== "paragraph_open" ||
      inline?.type !== "inline" ||
      paragraphClose?.type !== "paragraph_close"
    ) {
      continue;
    }

    const firstChild = inline.children?.[0];
    if (!firstChild || firstChild.type !== "text") {
      continue;
    }

    const match = firstChild.content.match(taskListMarkerPattern);
    if (!match) {
      continue;
    }

    const marker = match[1];
    if (!marker) {
      continue;
    }

    const checked = marker.toLowerCase() === "x";
    const label = escapeHtml(l10n.t(checked ? "Completed task" : "Incomplete task"));
    const checkboxToken = new state.Token("html_inline", "", 0);
    checkboxToken.content = checked
      ? `<input type="checkbox" id="" disabled="" class="task-list-item-checkbox" aria-label="${label}" checked=""> `
      : `<input type="checkbox" id="" disabled="" class="task-list-item-checkbox" aria-label="${label}"> `;

    const inlineChildren = inline.children ? [...inline.children] : [];
    firstChild.content = firstChild.content.slice(match[0].length);
    if (firstChild.content.length === 0) {
      inline.children = [checkboxToken, ...inlineChildren.slice(1)];
    } else {
      inline.children = [checkboxToken, ...inlineChildren];
    }

    attrJoinOnce(listItemOpen, "class", "task-list-item");
    attrJoinOnce(paragraphOpen, "class", "task-list-item-paragraph");

    const listOpen = openLists.get(listItemOpen.level - 1);
    if (listOpen) {
      attrJoinOnce(listOpen, "class", "contains-task-list");
    }
  }
}

function attrJoinOnce(token: MarkdownToken, name: string, value: string) {
  const current = token.attrGet(name);
  if (typeof current === "string" && current.split(/\s+/).includes(value)) {
    return;
  }

  token.attrJoin(name, value);
}
