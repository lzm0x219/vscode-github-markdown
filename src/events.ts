import vscode from "vscode";
import { section } from "./configuration";
import { syncCurrentMermaidTheme } from "./integrations/mermaid";

export const onMarkdownPreviewRefresh: vscode.Disposable =
  vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (!e.affectsConfiguration(section.namespace)) {
      return;
    }

    try {
      await syncCurrentMermaidTheme();
    } catch (error) {
      console.error("[github-markdown] Failed to sync Mermaid theme:", error);
    }

    try {
      await vscode.commands.executeCommand("markdown.preview.refresh");
    } catch (error) {
      console.error("[github-markdown] Failed to refresh preview:", error);
    }
  });
