import vscode from "vscode";
import markdownItGitHubTheme from "./markdown/markdown-it-github-theme";

export function activate(context: vscode.ExtensionContext) {
  return {
    extendMarkdownIt(md: markdownit) {
      return md.use(markdownItGitHubTheme);
    },
  };
}

export function deactivate() {
  console.log("bye~");
}
