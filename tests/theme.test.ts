import { beforeEach, describe, expect, it, vi } from "vitest";

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
  }
}));

import {
  getCurrentDarkTheme,
  getCurrentLightTheme,
  getCurrentSystemTheme,
  getThemeColorMode,
  getThemeList,
  getThemeModeList,
  type Theme
} from "../src/theme";

describe("theme logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configStore = {
      "theme.mode": "system",
      "theme.single": "light",
      "theme.light": "light",
      "theme.dark": "dark"
    };
  });

  describe("getThemeColorMode", () => {
    it('returns "light" in single mode with light theme', () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "light";
      expect(getThemeColorMode()).toBe("light");
    });

    it('returns "dark" in single mode with dark theme', () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "dark";
      expect(getThemeColorMode()).toBe("dark");
    });

    it('returns "dark" in single mode with dark_dimmed theme', () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "dark_dimmed";
      expect(getThemeColorMode()).toBe("dark");
    });

    it('returns "light" in single mode with light_high_contrast theme', () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "light_high_contrast";
      expect(getThemeColorMode()).toBe("light");
    });

    it('returns "auto" in system mode regardless of theme', () => {
      configStore["theme.mode"] = "system";
      expect(getThemeColorMode()).toBe("auto");
    });
  });

  describe("getCurrentLightTheme", () => {
    it("returns the single theme when it is a light theme", () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "light_colorblind";
      expect(getCurrentLightTheme()).toBe("light_colorblind");
    });

    it("falls back to configured light theme when single theme is dark", () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "dark_dimmed";
      configStore["theme.light"] = "light_tritanopia";
      expect(getCurrentLightTheme()).toBe("light_tritanopia");
    });

    it("returns configured light theme in system mode", () => {
      configStore["theme.mode"] = "system";
      configStore["theme.light"] = "light_high_contrast";
      expect(getCurrentLightTheme()).toBe("light_high_contrast");
    });
  });

  describe("getCurrentDarkTheme", () => {
    it("returns the single theme when it is a dark theme", () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "dark_colorblind";
      expect(getCurrentDarkTheme()).toBe("dark_colorblind");
    });

    it("falls back to configured dark theme when single theme is light", () => {
      configStore["theme.mode"] = "single";
      configStore["theme.single"] = "light";
      configStore["theme.dark"] = "dark_high_contrast";
      expect(getCurrentDarkTheme()).toBe("dark_high_contrast");
    });

    it("returns configured dark theme in system mode", () => {
      configStore["theme.mode"] = "system";
      configStore["theme.dark"] = "dark_tritanopia";
      expect(getCurrentDarkTheme()).toBe("dark_tritanopia");
    });
  });

  describe("getCurrentSystemTheme", () => {
    it("returns light theme during daytime (6 AM)", () => {
      vi.setSystemTime(new Date("2026-06-22T06:00:00"));
      configStore["theme.light"] = "light_colorblind";
      expect(getCurrentSystemTheme()).toBe("light_colorblind");
    });

    it("returns light theme during daytime (noon)", () => {
      vi.setSystemTime(new Date("2026-06-22T12:00:00"));
      configStore["theme.light"] = "light";
      expect(getCurrentSystemTheme()).toBe("light");
    });

    it("returns dark theme at night (18:00)", () => {
      vi.setSystemTime(new Date("2026-06-22T18:00:00"));
      configStore["theme.dark"] = "dark_dimmed";
      expect(getCurrentSystemTheme()).toBe("dark_dimmed");
    });

    it("returns dark theme at midnight", () => {
      vi.setSystemTime(new Date("2026-06-22T00:00:00"));
      configStore["theme.dark"] = "dark";
      expect(getCurrentSystemTheme()).toBe("dark");
    });

    it("returns light theme at 17:59 (still daytime)", () => {
      vi.setSystemTime(new Date("2026-06-22T17:59:00"));
      configStore["theme.light"] = "light_tritanopia";
      expect(getCurrentSystemTheme()).toBe("light_tritanopia");
    });
  });

  describe("getThemeModeList", () => {
    it("returns mode options", () => {
      const list = getThemeModeList();
      expect(list).toHaveLength(2);
      expect(list[0]).toEqual({ label: "Single theme", value: "single" });
      expect(list[1]).toEqual({ label: "Sync with system", value: "system" });
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
});
