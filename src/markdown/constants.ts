export enum ThemeMode {
  Single = "single",
  System = "system",
}

export enum ThemeColorMode {
  Light = "light",
  Dark = "dark",
  Auto = "auto",
}

export const themeLabels = {
  light: "Light default",
  light_colorblind: "Light Protanopia & Deuteranopia",
  light_high_contrast: "Light high contrast",
  light_tritanopia: "Light Tritanopia",
  dark: "Dark default",
  dark_colorblind: "Dark Protanopia & Deuteranopia",
  dark_dimmed: "Dark dimmed",
  dark_high_contrast: "Dark high contrast",
  dark_tritanopia: "Dark Tritanopia",
};

export const themeModes = ["single", "system"];

export const themeModeLabels = {
  single: "Single theme",
  system: "Sync with system",
};
