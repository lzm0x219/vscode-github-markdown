import vscode from "vscode";

export type ThemeMode = "single" | "system";

export type ThemeColorMode = "light" | "dark" | "auto";

export type Theme =
  | "light"
  | "light_colorblind"
  | "light_high_contrast"
  | "light_tritanopia"
  | "dark"
  | "dark_colorblind"
  | "dark_dimmed"
  | "dark_high_contrast"
  | "dark_tritanopia";

export const ThemeLabels: Record<Theme, string> = {
  light: "Light default",
  light_colorblind: "Light Protanopia & Deuteranopia",
  light_high_contrast: "Light high contrast",
  light_tritanopia: "Light Tritanopia",
  dark: "Dark default",
  dark_colorblind: "Dark Protanopia & Deuteranopia",
  dark_dimmed: "Dark dimmed",
  dark_high_contrast: "Dark high contrast",
  dark_tritanopia: "Dark Tritanopia"
} as const;

export const ThemeKeys = Object.keys(ThemeLabels) as (keyof typeof ThemeLabels)[];

export const ThemeModeLabels: Record<ThemeMode, string> = {
  single: "Single theme",
  system: "Sync with system"
} as const;

export const ThemeModeKeys = Object.keys(ThemeModeLabels) as (keyof typeof ThemeModeLabels)[];

export const section = {
  namespace: "vscode-github-markdown",
  themeModeSection: "theme.mode",
  themeSingleSection: "theme.single",
  themeSystemDaySection: "theme.system.day",
  themeSystemNightSection: "theme.system.night"
} as const;

function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(section.namespace);
}

export function getThemeMode(): ThemeMode {
  return getConfiguration().get(section.themeModeSection, "system");
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await getConfiguration().update(section.themeModeSection, mode, true);
}

export function getThemeSingle(): Theme {
  return getConfiguration().get<Theme>(section.themeSingleSection, "light");
}

export async function setThemeSingle(theme: Theme): Promise<void> {
  await getConfiguration().update(section.themeSingleSection, theme, true);
}

export function getThemeSystemDay(): Theme {
  return getConfiguration().get<Theme>(section.themeSystemDaySection, "light");
}

export async function setThemeSystemDay(theme: Theme): Promise<void> {
  await getConfiguration().update(section.themeSystemDaySection, theme, true);
}

export function getThemeSystemNight(): Theme {
  return getConfiguration().get<Theme>(section.themeSystemNightSection, "dark");
}

export async function setThemeSystemNight(theme: Theme): Promise<void> {
  await getConfiguration().update(section.themeSystemNightSection, theme, true);
}

export function getThemeColorMode(): ThemeColorMode {
  const [mode, theme] = [getThemeMode(), getThemeSingle()];
  if (mode === "single") {
    return theme.includes("light") ? "light" : "dark";
  }
  return "auto";
}
