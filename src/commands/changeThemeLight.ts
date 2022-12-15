import vscode from "vscode";
import {
	themeLight,
	themeLightAlias,
	setThemeLight,
} from "../configuration/themeLight";

export const command = "vscode-markdown-github.changeThemeLight";

export const commandHander = async () => {
	const items = themeLight.map((theme) => ({
		label: themeLightAlias[theme],
		value: theme,
	}));

	const result = await vscode.window.showQuickPick(items, {
		placeHolder: "choose light theme",
	});

	if (result) {
		await setThemeLight(result.value);
	}
};
