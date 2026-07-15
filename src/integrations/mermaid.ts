import vscode from "vscode";
import { getConfiguration } from "../configuration";
import {
  getCurrentDarkTheme,
  getCurrentLightTheme,
  getSingleTheme,
  getThemeMode,
  isLightTheme,
  type Theme
} from "../theme";

export const originSection = {
  namespace: "markdown-mermaid",
  light: "lightModeTheme",
  dark: "darkModeTheme"
} as const;

export const section = {
  syncTheme: "mermaid.syncTheme"
} as const;

export const themes = ["vscode", "base", "forest", "dark", "default", "neutral"] as const;

export type MermaidTheme = (typeof themes)[number];

type MermaidThemeSnapshot = {
  light: MermaidTheme | undefined;
  dark: MermaidTheme | undefined;
};

const snapshotKey = "githubMarkdown.mermaid.originalGlobalThemes";
const mermaidExtensionId = "bierner.markdown-mermaid";
const MERMAID_LIGHT_THEME: MermaidTheme = "default";
const MERMAID_DARK_THEME: MermaidTheme = "dark";

export function getMermaidSyncTheme(): boolean {
  return getConfiguration().get<boolean>(section.syncTheme, true);
}

export async function updateMermaidThemeSync(memento: vscode.Memento): Promise<void> {
  if (!vscode.extensions.getExtension(mermaidExtensionId)) {
    return;
  }

  const configuration = getOriginMermaidThemeConfiguration();
  if (!hasMermaidThemeConfiguration(configuration)) {
    return;
  }

  if (!getMermaidSyncTheme()) {
    await restoreMermaidThemes(memento, configuration);
    return;
  }

  await preserveMermaidThemes(memento, configuration);
  const [light, dark] = resolveMermaidThemes();
  await Promise.all([
    updateMermaidTheme(configuration, originSection.light, light),
    updateMermaidTheme(configuration, originSection.dark, dark)
  ]);
}

function resolveMermaidThemes(): readonly [MermaidTheme, MermaidTheme] {
  if (getThemeMode() === "single") {
    const theme = resolveMermaidTheme(getSingleTheme());
    return [theme, theme];
  }

  return [resolveMermaidTheme(getCurrentLightTheme()), resolveMermaidTheme(getCurrentDarkTheme())];
}

function resolveMermaidTheme(markdownTheme: Theme): MermaidTheme {
  return isLightTheme(markdownTheme) ? MERMAID_LIGHT_THEME : MERMAID_DARK_THEME;
}

async function preserveMermaidThemes(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration
): Promise<void> {
  if (memento.get<MermaidThemeSnapshot>(snapshotKey)) {
    return;
  }

  await memento.update(snapshotKey, {
    light: configuration.inspect<MermaidTheme>(originSection.light)?.globalValue,
    dark: configuration.inspect<MermaidTheme>(originSection.dark)?.globalValue
  } satisfies MermaidThemeSnapshot);
}

async function restoreMermaidThemes(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration
): Promise<void> {
  const snapshot = memento.get<MermaidThemeSnapshot>(snapshotKey);
  if (!snapshot) {
    return;
  }

  await Promise.all([
    updateMermaidTheme(configuration, originSection.light, snapshot.light),
    updateMermaidTheme(configuration, originSection.dark, snapshot.dark)
  ]);
  await memento.update(snapshotKey, undefined);
}

function getOriginMermaidThemeConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(originSection.namespace);
}

function hasMermaidThemeConfiguration(configuration: vscode.WorkspaceConfiguration): boolean {
  return (
    configuration.inspect(originSection.light) !== undefined &&
    configuration.inspect(originSection.dark) !== undefined
  );
}

async function updateMermaidTheme(
  configuration: vscode.WorkspaceConfiguration,
  key: typeof originSection.light | typeof originSection.dark,
  theme: MermaidTheme | undefined
): Promise<void> {
  await configuration.update(key, theme, vscode.ConfigurationTarget.Global);
}
