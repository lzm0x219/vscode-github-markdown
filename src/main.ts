import vscode from "vscode";
import { changeThemeMode, changeThemeLight, changeThemeDark } from "./commands";
import { refreshPreview } from "./events";
import markdownItMermaid from "./plugins/markdown-it-mermaid";
import markdownItTheme from "./plugins/markdown-it-theme";
import markdownItCodeCopy from "./plugins/markdown-it-code-copy";
import markdownItImage from "./plugins/markdown-it-image";
import markdownItBlockquote from "./plugins/markdown-it-blockquote";

export function activate(context: vscode.ExtensionContext) {
  // register commands
  context.subscriptions.push(
    changeThemeMode,
    changeThemeLight,
    changeThemeDark
  );

  // register events
  context.subscriptions.push(refreshPreview);

  return {
    extendMarkdownIt(md: markdownit) {
      return md
        .use(markdownItTheme)
        .use(markdownItCodeCopy)
        .use(markdownItBlockquote)
        .use(markdownItMermaid)
        .use(markdownItImage(context))
        .use(require("markdown-it-emoji"))
        .use(require("markdown-it-github-headings"), {
          linkIcon: `<svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg>`,
        })
        .use(require("markdown-it-highlightjs"))
        .use(require("markdown-it-task-lists"))
        .use(require("markdown-it-footnote"));
    },
  };
}

export function deactivate() {
  console.log("bye~");
}
