import vscode from "vscode";
import { getConfiguration } from "../configuration";
import {
  getCurrentSystemTheme,
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
  syncTheme: "mermaid.syncTheme",
  light: "lightTheme",
  dark: "darkTheme"
} as const;

export const themes = ["vscode", "base", "forest", "dark", "default", "neutral"] as const;

export type MermaidTheme = (typeof themes)[number];

const MERMAID_LIGHT_THEME: MermaidTheme = "default";
const MERMAID_DARK_THEME: MermaidTheme = "dark";

export function getMermaidSyncTheme(): boolean {
  return getConfiguration().get<boolean>(section.syncTheme, true);
}

export async function setMermaidDarkTheme(theme: MermaidTheme): Promise<void> {
  await getConfiguration().update(section.dark, theme, true);
}

export function getOriginMermaidThemeConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(originSection.namespace);
}

export function getOriginMermaidLightTheme(): MermaidTheme {
  return getOriginMermaidThemeConfiguration().get(originSection.light, "default");
}

export async function setOriginMermaidLightTheme(theme: MermaidTheme): Promise<void> {
  await getOriginMermaidThemeConfiguration().update(originSection.light, theme, true);
}

export function getOriginMermaidDarkTheme(): MermaidTheme {
  return getOriginMermaidThemeConfiguration().get(originSection.dark, "dark");
}

export async function setOriginMermaidDarkTheme(theme: MermaidTheme): Promise<void> {
  await getOriginMermaidThemeConfiguration().update(originSection.dark, theme, true);
}

export function getActiveMermaidSetter(): (theme: MermaidTheme) => Promise<void> {
  const kind = vscode.window.activeColorTheme.kind;
  const isVsCodeDark = kind === vscode.ColorThemeKind.Dark;
  return isVsCodeDark ? setOriginMermaidDarkTheme : setOriginMermaidLightTheme;
}

function resolveMermaidTheme(markdownTheme: Theme): MermaidTheme {
  return isLightTheme(markdownTheme) ? MERMAID_LIGHT_THEME : MERMAID_DARK_THEME;
}

export async function syncCurrentMermaidTheme(): Promise<void> {
  if (!getMermaidSyncTheme()) {
    return;
  }

  const themeMode = getThemeMode();
  const setActiveMermaidTheme = getActiveMermaidSetter();

  if (themeMode === "single") {
    const markdownTheme = getSingleTheme();
    await setActiveMermaidTheme(resolveMermaidTheme(markdownTheme));
  }

  if (themeMode === "system") {
    const currentMarkdownTheme = getCurrentSystemTheme();
    await setActiveMermaidTheme(resolveMermaidTheme(currentMarkdownTheme));
  }
}
