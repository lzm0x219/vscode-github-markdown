import vscode from "vscode";

export const configurationSection = "vscode-markdown-github";

export function getConfiguration() {
	return vscode.workspace.getConfiguration(configurationSection);
}
