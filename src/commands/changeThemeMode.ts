import vscode from "vscode";
import {
	themeMode,
	themeModeAlias,
	setThemeMode,
} from "../configuration/themeMode";

export const command = "vscode-markdown-github.changeThemeMode";

export const commandHander = async () => {
	const items = themeMode.map((theme) => ({
		label: themeModeAlias[theme],
		value: theme,
	}));

	const result = await vscode.window.showQuickPick(items, {
		placeHolder: "choose theme mode",
	});

	if (result) {
		await setThemeMode(result.value);
	}
};
