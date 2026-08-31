import vscode from "vscode";
import type MarkdownIt from "markdown-it";
import { registerThemeCommands } from "./commands";
import { registerMarkdownPreviewEvents } from "./events";
import { restoreMermaidThemeSync, updateMermaidThemeSync } from "./integrations/mermaid";
import { extendMarkdownIt } from "./markdown-it";

let activeMemento: vscode.Memento | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<{
  extendMarkdownIt(md: MarkdownIt): MarkdownIt;
}> {
  activeMemento = context.globalState;
  context.subscriptions.push(...registerThemeCommands());
  context.subscriptions.push(registerMarkdownPreviewEvents(context.globalState));

  try {
    await updateMermaidThemeSync(context.globalState);
  } catch (error) {
    console.error("[github-markdown] Failed to sync Mermaid theme on activation:", error);
  }

  return { extendMarkdownIt };
}

export async function deactivate(): Promise<void> {
  const memento = activeMemento;
  activeMemento = undefined;
  if (!memento) {
    return;
  }

  try {
    await restoreMermaidThemeSync(memento);
  } catch (error) {
    console.error("[github-markdown] Failed to restore Mermaid theme on deactivation:", error);
  }
}
