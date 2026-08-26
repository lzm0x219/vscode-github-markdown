import vscode from "vscode";
import { section } from "./configuration";
import { updateMermaidThemeSync } from "./integrations/mermaid";

export function registerMarkdownPreviewEvents(memento: vscode.Memento): vscode.Disposable {
  const syncAndRefresh = async (): Promise<void> => {
    try {
      await updateMermaidThemeSync(memento);
    } catch (error) {
      console.error("[github-markdown] Failed to sync Mermaid theme:", error);
    }

    try {
      await vscode.commands.executeCommand("markdown.preview.refresh");
    } catch (error) {
      console.error("[github-markdown] Failed to refresh preview:", error);
    }
  };

  const configurationSubscription = vscode.workspace.onDidChangeConfiguration(async (e) => {
    if (!e.affectsConfiguration(section.namespace)) {
      return;
    }
    await syncAndRefresh();
  });
  const extensionSubscription = vscode.extensions.onDidChange(syncAndRefresh);

  return {
    dispose: () => {
      configurationSubscription.dispose();
      extensionSubscription.dispose();
    }
  };
}
