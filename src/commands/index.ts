import vscode from "vscode";
import * as changeThemeMode from "./changeThemeMode";
import * as changeThemeLight from "./changeThemeLight";
import * as changeThemeDark from "./changeThemeDark";

export const registerCommands = [
	changeThemeMode,
	changeThemeLight,
	changeThemeDark,
];

const commands = registerCommands.map(({ command, commandHander }) =>
	vscode.commands.registerCommand(command, commandHander),
);

export default commands;
