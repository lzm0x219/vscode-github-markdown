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
  light: "Light",
  light_colorblind: "Light Protanopia & Deuteranopia",
  light_high_contrast: "Light high contrast",
  light_tritanopia: "Light Tritanopia",
  dark: "Dark",
  dark_colorblind: "Dark Protanopia & Deuteranopia",
  dark_dimmed: "Dark dimmed",
  dark_high_contrast: "Dark high contrast",
  dark_tritanopia: "Dark Tritanopia"
} as const;

export const ThemeKeys = Object.keys(ThemeLabels) as Theme[];

export const ThemeModeLabels: Record<ThemeMode, string> = {
  single: "Single theme",
  system: "Sync with system"
} as const;

export const ThemeModeKeys = Object.keys(ThemeModeLabels) as (keyof typeof ThemeModeLabels)[];

export const section = {
  namespace: "githubMarkdown",
  mode: "theme.mode",
  single: "theme.single",
  light: "theme.light",
  dark: "theme.dark"
} as const;

function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(section.namespace);
}

export function getThemeMode(): ThemeMode {
  return getConfiguration().get(section.mode, "system");
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await getConfiguration().update(section.mode, mode, true);
}

export function getSingleTheme(): Theme {
  return getConfiguration().get<Theme>(section.single, "light");
}

export async function setSingleTheme(theme: Theme): Promise<void> {
  await getConfiguration().update(section.single, theme, true);
}

export function getLightTheme(): Theme {
  return getConfiguration().get<Theme>(section.light, "light");
}

export async function setLightTheme(theme: Theme): Promise<void> {
  await getConfiguration().update(section.light, theme, true);
}

export function getDarkTheme(): Theme {
  return getConfiguration().get<Theme>(section.dark, "dark");
}

export async function setDarkTheme(theme: Theme): Promise<void> {
  await getConfiguration().update(section.dark, theme, true);
}

export function getThemeColorMode(): ThemeColorMode {
  const [mode, theme] = [getThemeMode(), getSingleTheme()];
  if (mode === "single") {
    return theme.includes("light") ? "light" : "dark";
  }
  return "auto";
}

export function getCurrentLightTheme(): Theme {
  const [themeMode, singleTheme] = [getThemeMode(), getSingleTheme()];
  if (themeMode === "single") {
    return singleTheme.includes("light") ? getSingleTheme() : getLightTheme();
  }
  return getLightTheme();
}

export function getCurrentDarkTheme(): Theme {
  const [themeMode, singleTheme] = [getThemeMode(), getSingleTheme()];
  if (themeMode === "single") {
    return singleTheme.includes("dark") ? getSingleTheme() : getDarkTheme();
  }
  return getDarkTheme();
}

export function getThemeModeList(): {
  label: string;
  value: ThemeMode;
}[] {
  return ThemeModeKeys.map((theme) => ({
    label: ThemeModeLabels[theme],
    value: theme
  }));
}

export function getThemeList(): {
  label: string;
  value: Theme;
}[] {
  return ThemeKeys.map((theme) => ({
    label: ThemeLabels[theme],
    value: theme
  }));
}
