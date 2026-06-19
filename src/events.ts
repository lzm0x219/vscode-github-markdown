import vscode from "vscode";
import { section } from "./theme";

export const onMarkdownPreviewRefresh: vscode.Disposable =
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(section.namespace)) {
      vscode.commands.executeCommand("markdown.preview.refresh");
    }
  });
