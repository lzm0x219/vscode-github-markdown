import MarkdownIt from "markdown-it";
import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  default: {
    l10n: {
      t: (key: string) => key
    }
  },
  l10n: {
    t: (key: string) => key
  }
}));

import githubTaskLists from "../../src/plugins/markdown-it-github-task-lists";

describe("markdown-it-github-task-lists", () => {
  it("renders checked task list item", () => {
    const md = new MarkdownIt().use(githubTaskLists);
    const html = md.render("- [x] Completed task");
    expect(html).toContain("task-list-item-checkbox");
    expect(html).toContain('checked=""');
    expect(html).toContain("contains-task-list");
    expect(html).toContain("task-list-item");
  });

  it("renders unchecked task list item", () => {
    const md = new MarkdownIt().use(githubTaskLists);
    const html = md.render("- [ ] Incomplete task");
    expect(html).toContain("task-list-item-checkbox");
    expect(html).not.toContain('checked=""');
  });

  it("renders mixed checked and unchecked items", () => {
    const md = new MarkdownIt().use(githubTaskLists);
    const html = md.render("- [x] Done\n- [ ] Todo\n- [x] Also done");
    const checkedCount = (html.match(/checked=""/g) ?? []).length;
    expect(checkedCount).toBe(2);
  });

  it("preserves plain list items unchanged", () => {
    const md = new MarkdownIt().use(githubTaskLists);
    const html = md.render("- Plain item\n- Another item");
    expect(html).not.toContain("task-list-item-checkbox");
    expect(html).toContain("<li>Plain item</li>");
  });

  it("handles task list with inline link", () => {
    const md = new MarkdownIt().use(githubTaskLists);
    const html = md.render("- [x] Issue [#739](https://github.com/octo-org/octo-repo/issues/739)");
    expect(html).toContain('checked=""');
    expect(html).toContain('<a href="https://github.com/octo-org/octo-repo/issues/739">#739</a>');
  });

  it("does not add duplicate contains-task-list class", () => {
    const md = new MarkdownIt().use(githubTaskLists);
    const html = md.render("- [x] A\n- [ ] B");
    // The regex checks that "contains-task-list" appears exactly once in the <ul> tag
    const match = html.match(/<ul class="contains-task-list">/);
    expect(match).toBeTruthy();
  });
});
