import vscode from "vscode";
import { themes, themeAlias, setTheme } from "../themes";

export const command = "vscode-markdown-github.changeTheme";

export const commandHander = async () => {
	const items = themes.map((theme) => ({
		label: themeAlias[theme],
		value: theme,
	}));

	const result = await vscode.window.showQuickPick(items, {
		placeHolder: "choose a theme",
	});

	if (result) {
		await setTheme(result.value);
	}
};
