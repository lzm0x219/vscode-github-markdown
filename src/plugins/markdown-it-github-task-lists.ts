import { l10n } from "vscode";
import type MarkdownIt from "markdown-it";
import type { MarkdownToken, MarkdownState } from "./shared";

const taskListMarkerPattern = /^[ \t]*\[( |x|X)\][ \t]*/;

export default function markdownItGitHubTaskLists(md: MarkdownIt): MarkdownIt {
  md.core.ruler.after("inline", "github-markdown-task-lists", (state) => {
    applyTaskLists(state as unknown as MarkdownState);
  });

  return md;
}

function applyTaskLists(state: MarkdownState) {
  for (let index = 0; index < state.tokens.length - 3; index += 1) {
    const listItemOpen = state.tokens[index];
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
    const checkboxToken = new state.Token("html_inline", "", 0);
    checkboxToken.content = checked
      ? `<input type="checkbox" id="" disabled="" class="task-list-item-checkbox" aria-label="${l10n.t("Completed task")}" checked=""> `
      : `<input type="checkbox" id="" disabled="" class="task-list-item-checkbox" aria-label="${l10n.t("Incomplete task")}"> `;

    const inlineChildren = inline.children ? [...inline.children] : [];
    firstChild.content = firstChild.content.slice(match[0].length);
    if (firstChild.content.length === 0) {
      inline.children = [checkboxToken, ...inlineChildren.slice(1)];
    } else {
      inline.children = [checkboxToken, ...inlineChildren];
    }

    attrJoinOnce(listItemOpen, "class", "task-list-item");
    attrJoinOnce(paragraphOpen, "class", "task-list-item-paragraph");

    const listOpen = findParentListOpen(state.tokens, index, listItemOpen.level - 1);
    if (listOpen) {
      attrJoinOnce(listOpen, "class", "contains-task-list");
    }
  }
}

function attrJoinOnce(token: MarkdownToken, name: string, value: string) {
  const current = token.attrGet(name);
  if (current?.split(/\s+/).includes(value)) {
    return;
  }

  token.attrJoin(name, value);
}

function findParentListOpen(
  tokens: MarkdownToken[],
  fromIndex: number,
  level: number
): MarkdownToken | undefined {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    if (!token) {
      continue;
    }

    if (token.level !== level || token.nesting !== 1) {
      continue;
    }

    if (token.type === "bullet_list_open" || token.type === "ordered_list_open") {
      return token;
    }
  }

  return undefined;
}
