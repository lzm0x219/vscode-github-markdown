import vscode from "vscode";
import { configurationSection } from "../configuration";

export default function onRefreshMarkdownPreview(
	section: string = configurationSection,
) {
	return vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration(section)) {
			vscode.commands.executeCommand("markdown.preview.refresh");
		}
	});
}
