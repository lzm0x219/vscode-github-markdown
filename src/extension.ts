import vscode from "vscode";
import { refreshPreview } from "./markdown/events";
import markdownItGitHubTheme from "./markdown/plugins/markdown-it-github-theme";

export function activate(context: vscode.ExtensionContext) {
  // register events
  context.subscriptions.push(refreshPreview);

  return {
    extendMarkdownIt(md: markdownit) {
      return md.use(markdownItGitHubTheme);
    },
  };
}

export function deactivate() {
  console.log("bye~");
}
