import { beforeEach, describe, expect, it, vi } from "vitest";

// Config stores
let markdownConfig: Record<string, string | boolean> = {
  "theme.mode": "system",
  "theme.single": "light",
  "theme.light": "light",
  "theme.dark": "dark",
  "mermaid.syncTheme": true
};

let originMermaidConfig: Record<string, string> = {
  lightModeTheme: "default",
  darkModeTheme: "dark"
};

// Track update calls
const updateCalls: { key: string; value: string }[] = [];

// VS Code dark theme by default
let activeColorThemeKind = 2; // vscode.ColorThemeKind.Dark = 2

vi.mock("vscode", () => ({
  default: {
    ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 },
    window: {
      get activeColorTheme() {
        return { kind: activeColorThemeKind };
      }
    },
    workspace: {
      getConfiguration: (namespace?: string) => {
        if (namespace === "markdown-mermaid") {
          return {
            get: (key: string, defaultValue?: unknown) => {
              return key in originMermaidConfig ? originMermaidConfig[key] : defaultValue;
            },
            update: async (key: string, value: string) => {
              updateCalls.push({ key, value });
            }
          };
        }
        return {
          get: (key: string, defaultValue?: unknown) => {
            return key in markdownConfig ? markdownConfig[key] : defaultValue;
          },
          update: async (key: string, value: string) => {
            updateCalls.push({ key, value });
          }
        };
      }
    }
  }
}));

import { getActiveMermaidSetter, syncCurrentMermaidTheme } from "../../src/integrations/mermaid";

describe("mermaid integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateCalls.length = 0;
    markdownConfig = {
      "theme.mode": "system",
      "theme.single": "light",
      "theme.light": "light",
      "theme.dark": "dark",
      "mermaid.syncTheme": true
    };
    originMermaidConfig = {
      lightModeTheme: "default",
      darkModeTheme: "dark"
    };
    activeColorThemeKind = 2;
  });

  describe("getActiveMermaidSetter", () => {
    it("returns dark setter when VS Code is in dark theme", async () => {
      activeColorThemeKind = 2; // Dark
      const setter = getActiveMermaidSetter();
      await setter("dark");
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({ key: "darkModeTheme", value: "dark" });
    });

    it("returns light setter when VS Code is in light theme", async () => {
      activeColorThemeKind = 1; // Light
      const setter = getActiveMermaidSetter();
      await setter("default");
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]).toEqual({ key: "lightModeTheme", value: "default" });
    });
  });

  describe("syncCurrentMermaidTheme", () => {
    it("does nothing when syncTheme is disabled", async () => {
      markdownConfig["mermaid.syncTheme"] = false;
      await syncCurrentMermaidTheme();
      expect(updateCalls).toHaveLength(0);
    });

    it("in single mode with light theme, sets mermaid to default", async () => {
      markdownConfig["theme.mode"] = "single";
      markdownConfig["theme.single"] = "light_colorblind";
      await syncCurrentMermaidTheme();
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]?.value).toBe("default");
    });

    it("in single mode with dark theme, sets mermaid to dark", async () => {
      markdownConfig["theme.mode"] = "single";
      markdownConfig["theme.single"] = "dark_dimmed";
      await syncCurrentMermaidTheme();
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]?.value).toBe("dark");
    });

    it("in system mode during daytime, sets mermaid to default", async () => {
      vi.setSystemTime(new Date("2026-06-22T12:00:00"));
      markdownConfig["theme.mode"] = "system";
      markdownConfig["theme.light"] = "light_high_contrast";
      await syncCurrentMermaidTheme();
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]?.value).toBe("default");
    });

    it("in system mode during nighttime, sets mermaid to dark", async () => {
      vi.setSystemTime(new Date("2026-06-22T00:00:00"));
      markdownConfig["theme.mode"] = "system";
      markdownConfig["theme.dark"] = "dark_tritanopia";
      await syncCurrentMermaidTheme();
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0]?.value).toBe("dark");
    });
  });
});
