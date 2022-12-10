import vscode from "vscode";
import markdownItGithubTheme from "./plugins/markdown-it-github-theme";

export function activate(_context: vscode.ExtensionContext) {
	return {
		extendMarkdownIt(md: markdownit) {
			return md.use(markdownItGithubTheme).use(require("markdown-it-emoji"));
		},
	};
}

export function deactivate() {
	console.log("bye~");
}
