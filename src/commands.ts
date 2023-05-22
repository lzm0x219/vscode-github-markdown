import vscode from "vscode";
import {
  themeMode,
  themeModeAlias,
  setThemeMode,
} from "./configuration/themeMode";
import {
  setThemeDark,
  themeDark,
  themeDarkAlias,
} from "./configuration/themeDark";
import {
  setThemeLight,
  themeLight,
  themeLightAlias,
} from "./configuration/themeLight";

export const changeThemeMode = vscode.commands.registerCommand(
  "vscode-markdown-github.changeThemeMode",
  async () => {
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
  }
);

export const changeThemeDark = vscode.commands.registerCommand(
  "vscode-markdown-github.changeThemeDark",
  async () => {
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
  }
);

export const changeThemeLight = vscode.commands.registerCommand(
  "vscode-markdown-github.changeThemeLight",
  async () => {
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
  }
);
