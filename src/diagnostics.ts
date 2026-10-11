import vscode, { l10n } from "vscode";
import { getConfiguration } from "./configuration";
import { getMermaidSyncTheme, hasMermaidExtension } from "./integrations/mermaid";
import { getThemeMode } from "./theme";

const commandId = "vscode-github-markdown.copyPreviewDiagnostics";
type SettingInspection = {
  workspaceFolderValue?: unknown;
  workspaceValue?: unknown;
  globalValue?: unknown;
};

export function registerPreviewDiagnosticsCommand(extensionVersion: string): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const configuration = getConfiguration();
    const host = vscode.env.uiKind === vscode.UIKind.Web ? l10n.t("Web") : l10n.t("Desktop");
    const themeScope = getSettingScope(configuration.inspect("theme.mode"));
    const mermaidScope = getSettingScope(configuration.inspect("mermaid.syncTheme"));
    const report = [
      l10n.t("GitHub Markdown Preview diagnostics"),
      l10n.t("VS Code: {0} ({1})", vscode.version, host),
      l10n.t("Extension: {0}", extensionVersion),
      l10n.t("Theme mode: {0} ({1} setting)", getThemeMode(), themeScope),
      l10n.t(
        "Mermaid renderer: {0}",
        hasMermaidExtension() ? l10n.t("Available") : l10n.t("Not detected")
      ),
      l10n.t(
        "Mermaid theme sync: {0} ({1} setting)",
        getMermaidSyncTheme() ? l10n.t("Enabled") : l10n.t("Disabled"),
        mermaidScope
      )
    ].join("\n");

    try {
      await vscode.env.clipboard.writeText(report);
      void vscode.window.showInformationMessage(l10n.t("Preview diagnostics copied to clipboard."));
    } catch (error) {
      console.error(`[github-markdown] Failed to copy preview diagnostics: ${commandId}`, error);
      void vscode.window.showErrorMessage(
        l10n.t("Failed to copy preview diagnostics. See output for details.")
      );
    }
  });
}

function getSettingScope(inspection: SettingInspection | undefined): string {
  if (inspection?.workspaceFolderValue !== undefined) return l10n.t("Workspace Folder");
  if (inspection?.workspaceValue !== undefined) return l10n.t("Workspace");
  if (inspection?.globalValue !== undefined) return l10n.t("User");
  return l10n.t("Default");
}
