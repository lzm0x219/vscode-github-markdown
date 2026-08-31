import vscode, { l10n } from "vscode";
import { getConfiguration } from "./configuration";

export type ThemeMode = "single" | "system" | "vscode";

export type ThemeColorMode = "light" | "dark" | "auto" | "vscode";

export type LightTheme = "light" | "light_colorblind" | "light_high_contrast" | "light_tritanopia";

export type DarkTheme =
  | "dark"
  | "dark_colorblind"
  | "dark_dimmed"
  | "dark_high_contrast"
  | "dark_tritanopia";

export type Theme = LightTheme | DarkTheme;

export type ResolvedTheme = Readonly<{
  colorMode: ThemeColorMode;
  light: Theme;
  dark: Theme;
}>;

export const LightThemeKeys: readonly LightTheme[] = [
  "light",
  "light_colorblind",
  "light_high_contrast",
  "light_tritanopia"
] as const;

export const DarkThemeKeys: readonly DarkTheme[] = [
  "dark",
  "dark_colorblind",
  "dark_dimmed",
  "dark_high_contrast",
  "dark_tritanopia"
] as const;

export const ThemeKeys: readonly Theme[] = [...LightThemeKeys, ...DarkThemeKeys];

const lightThemeNames: ReadonlySet<Theme> = new Set(LightThemeKeys);

export function isLightTheme(theme: unknown): theme is LightTheme {
  return lightThemeNames.has(theme as Theme);
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
  return readThemeValue(getConfiguration(), section.mode, ThemeModeKeys, "system");
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await updateThemeConfiguration(section.mode, mode);
}

export function getSingleTheme(): Theme {
  return readThemeValue(getConfiguration(), section.single, ThemeKeys, "light");
}

export async function setSingleTheme(theme: Theme): Promise<void> {
  await updateThemeConfiguration(section.single, theme);
}

export function getLightTheme(): Theme {
  return readThemeValue(getConfiguration(), section.light, ThemeKeys, "light");
}

export async function setLightTheme(theme: LightTheme): Promise<void> {
  await updateThemeConfiguration(section.light, theme);
}

export function getDarkTheme(): Theme {
  return readThemeValue(getConfiguration(), section.dark, ThemeKeys, "dark");
}

export async function setDarkTheme(theme: DarkTheme): Promise<void> {
  await updateThemeConfiguration(section.dark, theme);
}

export function getResolvedTheme(): ResolvedTheme {
  const configuration = getConfiguration();
  const mode = readThemeValue(configuration, section.mode, ThemeModeKeys, "system");
  const single = readThemeValue(configuration, section.single, ThemeKeys, "light");
  const light = readThemeValue(configuration, section.light, ThemeKeys, "light");
  const dark = readThemeValue(configuration, section.dark, ThemeKeys, "dark");

  if (mode === "vscode") return { colorMode: "vscode", light, dark };
  if (mode === "system") return { colorMode: "auto", light, dark };
  return isLightTheme(single)
    ? { colorMode: "light", light: single, dark }
    : { colorMode: "dark", light, dark: single };
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
  return themeList(ThemeKeys);
}

export function getLightThemeList(): {
  label: string;
  value: LightTheme;
}[] {
  return themeList(LightThemeKeys);
}

export function getDarkThemeList(): {
  label: string;
  value: DarkTheme;
}[] {
  return themeList(DarkThemeKeys);
}

function themeList<T extends Theme>(themes: readonly T[]): { label: string; value: T }[] {
  return themes.map((theme) => ({
    label: themeLabels[theme](),
    value: theme
  }));
}

function readThemeValue<T extends string>(
  configuration: vscode.WorkspaceConfiguration,
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = configuration.get<unknown>(key);
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}
