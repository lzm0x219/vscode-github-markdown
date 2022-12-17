import vscode from "vscode";

export const configurationSection = "vscode-markdown-github";

export function getConfiguration() {
	const configuration = vscode.workspace.getConfiguration(configurationSection);

	// Compatible with v1 version
	const theme = configuration.get("theme");
	if (typeof theme === "string") {
		configuration.update("theme", undefined);
	}

	return configuration;
}
