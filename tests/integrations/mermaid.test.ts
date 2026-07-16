import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestMemento } from "../helpers/memento";

let markdownConfig: Record<string, string | boolean> = {
  "theme.mode": "system",
  "theme.single": "light",
  "theme.light": "light",
  "theme.dark": "dark",
  "mermaid.syncTheme": true
};

let mermaidGlobalConfig: Record<string, string | undefined> = {
  lightModeTheme: "neutral",
  darkModeTheme: "forest"
};
let mermaidConfigurationRegistered = true;
let mermaidExtensionIds = new Set(["vscode.mermaid-markdown-features"]);

const updateCalls: { key: string; value: string | undefined; target: number }[] = [];

vi.mock("vscode", () => ({
  default: {
    ConfigurationTarget: { Global: 1 },
    extensions: {
      getExtension: (id: string) => (mermaidExtensionIds.has(id) ? {} : undefined)
    },
    workspace: {
      getConfiguration: (namespace?: string) => {
        if (namespace === "markdown-mermaid") {
          return {
            inspect: (key: string) =>
              mermaidConfigurationRegistered
                ? { globalValue: mermaidGlobalConfig[key] }
                : undefined,
            update: async (key: string, value: string | undefined, target: number) => {
              updateCalls.push({ key, value, target });
              mermaidGlobalConfig[key] = value;
            }
          };
        }
        return {
          get: (key: string, defaultValue?: unknown) =>
            key in markdownConfig ? markdownConfig[key] : defaultValue
        };
      }
    }
  }
}));

import { updateMermaidThemeSync } from "../../src/integrations/mermaid";

describe("Mermaid theme synchronization", () => {
  beforeEach(() => {
    updateCalls.length = 0;
    markdownConfig = {
      "theme.mode": "system",
      "theme.single": "light",
      "theme.light": "light",
      "theme.dark": "dark",
      "mermaid.syncTheme": true
    };
    mermaidGlobalConfig = {
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    };
    mermaidConfigurationRegistered = true;
    mermaidExtensionIds = new Set(["vscode.mermaid-markdown-features"]);
  });

  it("configures both Mermaid slots from the system-mode light and dark themes", async () => {
    const memento = createTestMemento();
    markdownConfig["theme.light"] = "light_high_contrast";
    markdownConfig["theme.dark"] = "dark_tritanopia";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "default", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);
  });

  it("configures both Mermaid slots from the fixed theme in single mode", async () => {
    const memento = createTestMemento();
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "dark", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);
  });

  it("also supports the legacy external Mermaid extension", async () => {
    const memento = createTestMemento();
    mermaidExtensionIds = new Set(["bierner.markdown-mermaid"]);

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toHaveLength(2);
  });

  it("restores the user's global Mermaid settings when synchronization is disabled", async () => {
    const memento = createTestMemento();

    await updateMermaidThemeSync(memento);
    mermaidGlobalConfig["lightModeTheme"] = "base";
    mermaidGlobalConfig["darkModeTheme"] = "vscode";
    await updateMermaidThemeSync(memento);

    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "neutral", target: 1 },
      { key: "darkModeTheme", value: "forest", target: 1 }
    ]);
  });

  it("does not overwrite Mermaid choices made while synchronization was active", async () => {
    const memento = createTestMemento();

    await updateMermaidThemeSync(memento);
    mermaidGlobalConfig["lightModeTheme"] = "base";

    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "forest", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "forest"
    });
  });

  it("does not modify Mermaid settings when synchronization starts disabled", async () => {
    const memento = createTestMemento();
    markdownConfig["mermaid.syncTheme"] = false;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
  });

  it("does not modify settings when the Mermaid extension is not installed", async () => {
    const memento = createTestMemento();
    mermaidExtensionIds.clear();

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
  });

  it("does not modify settings when the Mermaid extension configuration is unavailable", async () => {
    const memento = createTestMemento();
    mermaidConfigurationRegistered = false;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
  });
});
