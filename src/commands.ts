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

function createThemeCommand<T extends string>(
  commandId: string,
  getList: () => { label: string; value: T }[],
  getCurrent: () => T,
  setCurrent: (value: T) => Promise<void>,
  placeholder: string,
  successMessage: (label: string) => string
): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const result = await vscode.window.showQuickPick(getList(), {
      placeHolder: placeholder
    });

    if (!result) {
      return;
    }

    if (result.value === getCurrent()) {
      return;
    }

    try {
      await setCurrent(result.value);
      vscode.window.showInformationMessage(successMessage(result.label));
    } catch (error) {
      console.error(`[github-markdown] Failed to update theme: ${commandId}`, error);
      vscode.window.showErrorMessage(l10n.t("Failed to change theme. See output for details."));
    }
  });
}

export function registerThemeCommands(): vscode.Disposable[] {
  return [
    createThemeCommand(
      "vscode-github-markdown.changeThemeMode",
      getThemeModeList,
      getThemeMode,
      setThemeMode,
      l10n.t("Select a theme mode"),
      (label) => l10n.t("Theme mode changed to {0}", label)
    ),
    createThemeCommand(
      "vscode-github-markdown.changeSingleTheme",
      getThemeList,
      getSingleTheme,
      setSingleTheme,
      l10n.t("Select a theme"),
      (label) => l10n.t("Single theme changed to {0}.", label)
    ),
    createThemeCommand(
      "vscode-github-markdown.changeLightTheme",
      getThemeList,
      getLightTheme,
      setLightTheme,
      l10n.t("Select a light theme"),
      (label) => l10n.t("Light theme changed to {0}.", label)
    ),
    createThemeCommand(
      "vscode-github-markdown.changeDarkTheme",
      getThemeList,
      getDarkTheme,
      setDarkTheme,
      l10n.t("Select a dark theme"),
      (label) => l10n.t("Dark theme changed to {0}.", label)
    )
  ];
}
