import { beforeEach, describe, expect, it, vi } from "vitest";

const localizedMessages = vi.hoisted(() => ({ values: {} as Record<string, string> }));

let configStore: Record<string, string> = {
  "theme.mode": "system",
  "theme.single": "light",
  "theme.light": "light",
  "theme.dark": "dark"
};

vi.mock("vscode", () => ({
  default: {
    workspace: {
      getConfiguration: () => ({
        get: (key: string, defaultValue?: unknown) => {
          return key in configStore ? configStore[key] : defaultValue;
        },
        update: async () => {}
      })
    }
  },
  l10n: {
    t: (message: string) => localizedMessages.values[message] ?? message
  }
}));

import { getResolvedTheme, getThemeList, getThemeModeList, type Theme } from "../src/theme";

describe("theme logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localizedMessages.values = {};
    configStore = {
      "theme.mode": "system",
      "theme.single": "light",
      "theme.light": "light",
      "theme.dark": "dark"
    };
  });

  describe("getResolvedTheme", () => {
    it("resolves system mode from configured light and dark themes", () => {
      configStore["theme.light"] = "light_high_contrast";
      configStore["theme.dark"] = "dark_tritanopia";

      expect(getResolvedTheme()).toEqual({
        colorMode: "auto",
        light: "light_high_contrast",
        dark: "dark_tritanopia"
      });
    });

    it("uses a light single theme without discarding the configured dark theme", () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "light_colorblind";
      configStore["theme.dark"] = "dark_high_contrast";

      expect(getResolvedTheme()).toEqual({
        colorMode: "light",
        light: "light_colorblind",
        dark: "dark_high_contrast"
      });
    });

    it("uses a dark single theme without discarding the configured light theme", () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "dark_dimmed";
      configStore["theme.light"] = "light_tritanopia";

      expect(getResolvedTheme()).toEqual({
        colorMode: "dark",
        light: "light_tritanopia",
        dark: "dark_dimmed"
      });
    });

    it("resolves VS Code mode", () => {
      configStore["theme.mode"] = "vscode";

      expect(getResolvedTheme()).toEqual({
        colorMode: "vscode",
        light: "light",
        dark: "dark"
      });
    });

    it("falls back when persisted theme settings are invalid", () => {
      configStore = {
        "theme.mode": "unknown",
        "theme.single": "unknown",
        "theme.light": "unknown",
        "theme.dark": "unknown"
      };

      expect(getResolvedTheme()).toEqual({
        colorMode: "auto",
        light: "light",
        dark: "dark"
      });
    });
  });

  describe("getThemeModeList", () => {
    it("returns mode options", () => {
      const list = getThemeModeList();
      expect(list).toHaveLength(3);
      expect(list[0]).toEqual({ label: "Single theme", value: "single" });
      expect(list[1]).toEqual({ label: "Sync with system", value: "system" });
      expect(list[2]).toEqual({ label: "VS Code theme", value: "vscode" });
    });
  });

  describe("getThemeList", () => {
    it("returns all 9 themes with labels", () => {
      const list = getThemeList();
      expect(list).toHaveLength(9);
      const values = list.map((item) => item.value);
      const expectedThemes: Theme[] = [
        "light",
        "light_colorblind",
        "light_high_contrast",
        "light_tritanopia",
        "dark",
        "dark_colorblind",
        "dark_dimmed",
        "dark_high_contrast",
        "dark_tritanopia"
      ];
      expect(values).toEqual(expectedThemes);

      const labels = new Set(list.map((item) => item.label));
      expect(labels.has("Light")).toBe(true);
      expect(labels.has("Dark dimmed")).toBe(true);
    });
  });

  it("resolves theme option labels when each list is requested", () => {
    expect(getThemeModeList()[0]).toEqual({ label: "Single theme", value: "single" });
    expect(getThemeList()[6]).toEqual({ label: "Dark dimmed", value: "dark_dimmed" });

    localizedMessages.values = {
      "Single theme": "固定主题",
      "Dark dimmed": "柔和暗色"
    };

    expect(getThemeModeList()[0]).toEqual({ label: "固定主题", value: "single" });
    expect(getThemeList()[6]).toEqual({ label: "柔和暗色", value: "dark_dimmed" });
  });
});
