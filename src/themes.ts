import vscode from "vscode";
import { configurationSection, getConfiguration } from "./configuration";

export type Theme = typeof themes[number];

export const themes = [
	"github-light-default",
	"github-dark-default",
	"vscode-theme-auto",
] as const;

export const themeAlias: Record<Theme, string> = {
	"github-light-default": "Github Light",
	"github-dark-default": "Github Dark",
	"vscode-theme-auto": "Auto",
};

export const themeSection = "theme";

export function getTheme() {
	const configuration = getConfiguration();
	return configuration.get<Theme>(themeSection);
}

export async function setTheme(theme: Theme) {
	const configuration = getConfiguration();
	await configuration.update(themeSection, theme);
}

export const onChangeTheme = vscode.workspace.onDidChangeConfiguration((e) => {
	if (e.affectsConfiguration(configurationSection)) {
		vscode.commands.executeCommand("markdown.preview.refresh");
	}
});
