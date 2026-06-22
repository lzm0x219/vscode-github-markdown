import vscode from "vscode";

export const section = {
  namespace: "githubMarkdown"
} as const;

export function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(section.namespace);
}
