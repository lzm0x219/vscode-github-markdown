import vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  return {
    // extendMarkdownIt(md: markdownit) {
    //   return md.use(markdownItGitHubTheme);
    // },
  };
}

export function deactivate() {
  console.log("bye~");
}
