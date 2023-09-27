import vscode from "vscode";
import configuration from "./configuration";

export const changeThemeMode = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeMode",
  async () => {
    const items = configuration.themeMode.map((theme) => ({
      label: configuration.themeModeAlias[theme],
      value: theme,
    }));

    const result = await vscode.window.showQuickPick(items, {
      placeHolder: "choose theme mode",
    });

    if (result) {
      await configuration.setThemeMode(result.value);
    }
  },
);

export const changeThemeDark = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeDark",
  async () => {
    const items = configuration.themeDark.map((theme) => ({
      label: configuration.themeDarkAlias[theme],
      value: theme,
    }));

    const result = await vscode.window.showQuickPick(items, {
      placeHolder: "choose dark theme",
    });

    if (result) {
      await configuration.setThemeDark(result.value);
    }
  },
);

export const changeThemeLight = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeLight",
  async () => {
    const items = configuration.themeLight.map((theme) => ({
      label: configuration.themeLightAlias[theme],
      value: theme,
    }));

    const result = await vscode.window.showQuickPick(items, {
      placeHolder: "choose light theme",
    });

    if (result) {
      await configuration.setThemeLight(result.value);
    }
  },
);
