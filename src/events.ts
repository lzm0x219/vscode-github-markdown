import vscode from "vscode";
import { configurationSection } from "./configuration";

export const refreshPreview = vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration(configurationSection)) {
    vscode.commands.executeCommand("markdown.preview.refresh");
  }
});
