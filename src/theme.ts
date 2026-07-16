import { getConfiguration } from "./configuration";

export type ThemeMode = "single" | "system" | "vscode";

export type ThemeColorMode = "light" | "dark" | "auto" | "vscode";

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

const lightThemeNames: Set<Theme> = new Set([
  "light",
  "light_colorblind",
  "light_high_contrast",
  "light_tritanopia"
]);

export function isLightTheme(theme: Theme): boolean {
  return lightThemeNames.has(theme);
}

const themeLabelKeys: Record<Theme, string> = {
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

export const ThemeKeys = Object.keys(themeLabelKeys) as Theme[];

const themeModeLabelKeys: Record<ThemeMode, string> = {
  single: "Single theme",
  system: "Sync with system",
  vscode: "VS Code theme"
} as const;

export const ThemeModeKeys = Object.keys(themeModeLabelKeys) as (keyof typeof themeModeLabelKeys)[];

export const section = {
  mode: "theme.mode",
  single: "theme.single",
  light: "theme.light",
  dark: "theme.dark"
} as const;

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
  if (mode === "vscode") {
    return "vscode";
  }
  if (mode === "single") {
    return isLightTheme(theme) ? "light" : "dark";
  }
  return "auto";
}

export function getCurrentLightTheme(): Theme {
  const themeMode = getThemeMode();
  const singleTheme = getSingleTheme();
  if (themeMode === "single") {
    return isLightTheme(singleTheme) ? singleTheme : getLightTheme();
  }
  return getLightTheme();
}

export function getCurrentDarkTheme(): Theme {
  const themeMode = getThemeMode();
  const singleTheme = getSingleTheme();
  if (themeMode === "single") {
    return isLightTheme(singleTheme) ? getDarkTheme() : singleTheme;
  }
  return getDarkTheme();
}

export function getThemeModeList(): {
  label: string;
  value: ThemeMode;
}[] {
  return ThemeModeKeys.map((mode) => ({
    label: themeModeLabelKeys[mode],
    value: mode
  }));
}

export function getThemeList(): {
  label: string;
  value: Theme;
}[] {
  return ThemeKeys.map((theme) => ({
    label: themeLabelKeys[theme],
    value: theme
  }));
}
