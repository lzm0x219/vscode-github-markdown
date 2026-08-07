import vscode, { l10n } from "vscode";
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

const themeLabels: Record<Theme, () => string> = {
  light: () => l10n.t("Light"),
  light_colorblind: () => l10n.t("Light Protanopia & Deuteranopia"),
  light_high_contrast: () => l10n.t("Light high contrast"),
  light_tritanopia: () => l10n.t("Light Tritanopia"),
  dark: () => l10n.t("Dark"),
  dark_colorblind: () => l10n.t("Dark Protanopia & Deuteranopia"),
  dark_dimmed: () => l10n.t("Dark dimmed"),
  dark_high_contrast: () => l10n.t("Dark high contrast"),
  dark_tritanopia: () => l10n.t("Dark Tritanopia")
} as const;

export const ThemeKeys = Object.keys(themeLabels) as Theme[];

const themeModeLabels: Record<ThemeMode, () => string> = {
  single: () => l10n.t("Single theme"),
  system: () => l10n.t("Sync with system"),
  vscode: () => l10n.t("VS Code theme")
} as const;

export const ThemeModeKeys = Object.keys(themeModeLabels) as (keyof typeof themeModeLabels)[];

export const section = {
  mode: "theme.mode",
  single: "theme.single",
  light: "theme.light",
  dark: "theme.dark"
} as const;

async function updateThemeConfiguration<T>(
  key: (typeof section)[keyof typeof section],
  value: T
): Promise<void> {
  const configuration = getConfiguration();
  // Theme settings use window scope, so an unscoped configuration cannot write WorkspaceFolder.
  const target =
    configuration.inspect<T>(key)?.workspaceValue === undefined
      ? vscode.ConfigurationTarget.Global
      : vscode.ConfigurationTarget.Workspace;
  await configuration.update(key, value, target);
}

export function getThemeMode(): ThemeMode {
  return getConfiguration().get(section.mode, "system");
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await updateThemeConfiguration(section.mode, mode);
}

export function getSingleTheme(): Theme {
  return getConfiguration().get<Theme>(section.single, "light");
}

export async function setSingleTheme(theme: Theme): Promise<void> {
  await updateThemeConfiguration(section.single, theme);
}

export function getLightTheme(): Theme {
  return getConfiguration().get<Theme>(section.light, "light");
}

export async function setLightTheme(theme: Theme): Promise<void> {
  await updateThemeConfiguration(section.light, theme);
}

export function getDarkTheme(): Theme {
  return getConfiguration().get<Theme>(section.dark, "dark");
}

export async function setDarkTheme(theme: Theme): Promise<void> {
  await updateThemeConfiguration(section.dark, theme);
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
    label: themeModeLabels[mode](),
    value: mode
  }));
}

export function getThemeList(): {
  label: string;
  value: Theme;
}[] {
  return ThemeKeys.map((theme) => ({
    label: themeLabels[theme](),
    value: theme
  }));
}
