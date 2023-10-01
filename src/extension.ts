import vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  return {
    extendMarkdownIt(md: markdownit) {
      return md;
    },
  };
}

export function deactivate() {
  console.log("bye~");
}
