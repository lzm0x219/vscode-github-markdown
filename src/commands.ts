import vscode, { l10n } from "vscode";
import {
  setThemeMode,
  getThemeMode,
  setSingleTheme,
  getThemeModeList,
  getThemeList,
  setLightTheme,
  setDarkTheme,
  getSingleTheme,
  getLightTheme,
  getDarkTheme
} from "./theme";

export const changeThemeMode: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeThemeMode",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeModeList(), {
      placeHolder: l10n.t("Select a theme mode")
    });

    if (result) {
      if (result.value === getThemeMode()) {
        return;
      }
      await setThemeMode(result.value);
      vscode.window.showInformationMessage(l10n.t("Theme mode changed to {0}", result.label));
    }
  }
);

export const changeSingleTheme: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeSingleTheme",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeList(), {
      placeHolder: l10n.t("Select a theme")
    });

    if (result) {
      if (result.value === getSingleTheme()) {
        return;
      }
      await setSingleTheme(result.value);
      vscode.window.showInformationMessage(l10n.t("Single theme changed to {0}.", result.label));
    }
  }
);

export const changeLightTheme: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeLightTheme",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeList(), {
      placeHolder: l10n.t("Select a theme for day")
    });

    if (result) {
      if (result.value === getLightTheme()) {
        return;
      }
      await setLightTheme(result.value);
      vscode.window.showInformationMessage(l10n.t("Day theme changed to {0}.", result.label));
    }
  }
);

export const changeDarkTheme: vscode.Disposable = vscode.commands.registerCommand(
  "vscode-github-markdown.changeDarkTheme",
  async () => {
    const result = await vscode.window.showQuickPick(getThemeList(), {
      placeHolder: l10n.t("Select a theme for night")
    });

    if (result) {
      if (result.value === getDarkTheme()) {
        return;
      }
      await setDarkTheme(result.value);
      vscode.window.showInformationMessage(l10n.t("Night theme changed to {0}.", result.label));
    }
  }
);
