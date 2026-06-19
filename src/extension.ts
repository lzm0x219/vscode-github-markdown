import vscode from "vscode";
import type MarkdownIt from "markdown-it";
import { onMarkdownPreviewRefresh } from "./events";
import theme from "./plugins/markdown-it-github-theme";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(onMarkdownPreviewRefresh);

  return {
    extendMarkdownIt(md: MarkdownIt): MarkdownIt {
      return md.use(theme);
    }
  };
}
