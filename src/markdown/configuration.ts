import vscode from "vscode";
import { ThemeMode } from "./constants";

export type Theme = (typeof Configuration.themes)[number];

export default class Configuration {
  static section = "vscode-github-markdown";

  static themeModeSection = "theme.mode";

  static themeSingleSection = "theme.single";

  static themeSystemDaySection = "theme.system.day";

  static themeSystemNightSection = "theme.system.night";

  static configuration = vscode.workspace.getConfiguration(
    Configuration.section,
  );

  static themes = [
    "light",
    "light_colorblind",
    "light_high_contrast",
    "light_tritanopia",
    "dark",
    "dark_colorblind",
    "dark_dimmed",
    "dark_high_contrast",
    "dark_tritanopia",
  ] as const;

  static getThemeMode() {
    return (
      this.configuration.get<ThemeMode>(this.themeModeSection) ||
      ThemeMode.System
    );
  }

  static async setThemeMode(mode: ThemeMode) {
    await this.configuration.update(this.themeModeSection, mode, true);
  }

  static getThemeSingle() {
    return this.configuration.get<Theme>(this.themeSingleSection) || "light";
  }

  static async setThemeSingle(theme: Theme) {
    await this.configuration.update(this.themeSingleSection, theme, true);
  }

  static getThemeSystemDay() {
    return this.configuration.get<Theme>(this.themeSystemDaySection);
  }

  static async setThemeSystemDay(theme: Theme) {
    await this.configuration.update(this.themeSystemDaySection, theme, true);
  }

  static getThemeSystemNight() {
    return this.configuration.get<Theme>(this.themeSystemNightSection);
  }

  static async setThemeSystemNight(theme: Theme) {
    await this.configuration.update(this.themeSystemNightSection, theme, true);
  }
}
