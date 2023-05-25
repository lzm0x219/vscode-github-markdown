import vscode from "vscode";
import configuration from "./configuration";

export const refreshPreview = vscode.workspace.onDidChangeConfiguration((e) => {
  const configurationSection = configuration.getConfigurationSection();
  if (e.affectsConfiguration(configurationSection)) {
    vscode.commands.executeCommand("markdown.preview.refresh");
  }
});
