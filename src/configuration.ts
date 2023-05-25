import vscode from "vscode";

class Configuration {
  private static instance: Configuration | undefined;
  private configurationSection = "vscode-markdown-github";
  private themeModeSection = "theme.mode";
  private themeLightSection = "theme.light";
  private themeDarkSection = "theme.dark";

  private constructor() {}

  get themeDark() {
    return [
      "dark",
      "dark_colorblind",
      "dark_dimmed",
      "dark_high_contrast",
      "dark_tritanopia",
    ] as const;
  }

  get themeLight() {
    return [
      "light",
      "light_colorblind",
      "light_high_contrast",
      "light_tritanopia",
    ] as const;
  }

  get themeMode() {
    return ["light", "dark", "auto"] as const;
  }

  get themeDarkAlias() {
    return {
      dark: "Dark default",
      dark_colorblind: "Dark Protanopia & Deuteranopia",
      dark_dimmed: "Dark dimmed",
      dark_high_contrast: "Dark high contrast",
      dark_tritanopia: "Dark Tritanopia",
    };
  }

  get themeLightAlias() {
    return {
      light: "Light default",
      light_colorblind: "Light Protanopia & Deuteranopia",
      light_high_contrast: "Light high contrast",
      light_tritanopia: "Light Tritanopia",
    };
  }

  get themeModeAlias() {
    return {
      light: "Light",
      dark: "Dark",
      auto: "Sync to the system",
    };
  }

  public static getInstance() {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration();
    }

    return Configuration.instance;
  }

  public getConfiguration() {
    const configuration = vscode.workspace.getConfiguration(
      this.configurationSection
    );

    const theme = configuration.get("theme");
    if (typeof theme === "string") {
      configuration.update("theme", undefined);
    }

    return configuration;
  }

  public getConfigurationSection() {
    return this.configurationSection;
  }

  public getThemeMode() {
    const configuration = this.getConfiguration();
    return configuration.get<ThemeMode>(this.themeModeSection);
  }

  public async setThemeMode(mode: ThemeMode) {
    const configuration = this.getConfiguration();
    await configuration.update(this.themeModeSection, mode, true);
  }

  public getThemeDark() {
    const configuration = this.getConfiguration();
    return configuration.get<ThemeDark>(this.themeDarkSection);
  }

  public async setThemeDark(theme: ThemeDark) {
    const configuration = this.getConfiguration();
    await configuration.update(this.themeDarkSection, theme, true);
  }

  public getThemeLight() {
    const configuration = this.getConfiguration();
    return configuration.get<ThemeLight>(this.themeLightSection);
  }

  public async setThemeLight(theme: ThemeLight) {
    const configuration = this.getConfiguration();
    await configuration.update(this.themeLightSection, theme, true);
  }
}

const configuration = Configuration.getInstance();

export default configuration;

export type ThemeDark = (typeof configuration.themeDark)[number];
export type ThemeLight = (typeof configuration.themeLight)[number];
export type ThemeMode = (typeof configuration.themeMode)[number];
