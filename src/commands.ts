import vscode, { l10n } from "vscode";
import {
  setThemeMode,
  setThemeSingle,
  getThemeModeList,
  getThemeList,
  setThemeSystemDay,
  setThemeSystemNight
} from "./theme";

export const changeThemeMode: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeMode",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeModeList(), {
      placeHolder: l10n.t("Select a theme mode")
    });

    if (result) {
      await setThemeMode(result.value);
    }
  }
);

export const changeThemeSingle: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeSingle",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeList(), {
      placeHolder: l10n.t("Select a theme")
    });

    if (result) {
      await setThemeSingle(result.value);
    }
  }
);

export const changeThemeSystemDay: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeSystemDay",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeList(), {
      placeHolder: l10n.t("Select a theme for day")
    });

    if (result) {
      await setThemeSystemDay(result.value);
    }
  }
);

export const changeThemeSystemNight: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeSystemNight",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeList(), {
      placeHolder: l10n.t("Select a theme for night")
    });

    if (result) {
      await setThemeSystemNight(result.value);
    }
  }
);
