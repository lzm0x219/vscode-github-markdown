import vscode from "vscode";
import {
	themeDark,
	themeDarkAlias,
	setThemeDark,
} from "../configuration/themeDark";

export const command = "vscode-markdown-github.changeThemeDark";

export const commandHander = async () => {
	const items = themeDark.map((theme) => ({
		label: themeDarkAlias[theme],
		value: theme,
	}));

	const result = await vscode.window.showQuickPick(items, {
		placeHolder: "choose dark theme",
	});

	if (result) {
		await setThemeDark(result.value);
	}
};
