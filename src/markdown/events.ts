import vscode from "vscode";
import configuration from "./configuration";

export const refreshPreview = vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration(configuration.section)) {
    vscode.commands.executeCommand("markdown.preview.refresh");
  }
});
