import vscode from "vscode";
import { section } from "./configuration";
import { syncCurrentMermaidTheme } from "./integrations/mermaid";

export const onMarkdownPreviewRefresh: vscode.Disposable =
  vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (!e.affectsConfiguration(section.namespace)) {
      return;
    }

    await syncCurrentMermaidTheme();
    vscode.commands.executeCommand("markdown.preview.refresh");
  });
