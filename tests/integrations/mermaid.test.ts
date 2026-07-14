import type vscode from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
let mermaidExtensionInstalled = true;

const updateCalls: { key: string; value: string | undefined; target: number }[] = [];

vi.mock("vscode", () => ({
  default: {
    ConfigurationTarget: { Global: 1 },
    extensions: {
      getExtension: () => (mermaidExtensionInstalled ? {} : undefined)
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

function createMemento(): vscode.Memento {
  const values = new Map<string, unknown>();
  return {
    get: <T>(key: string, defaultValue?: T) =>
      (values.has(key) ? values.get(key) : defaultValue) as T,
    update: async (key: string, value: unknown) => {
      if (value === undefined) values.delete(key);
      else values.set(key, value);
    },
    keys: () => [...values.keys()]
  };
}

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
    mermaidExtensionInstalled = true;
  });

  it("configures both Mermaid slots from the system-mode light and dark themes", async () => {
    const memento = createMemento();
    markdownConfig["theme.light"] = "light_high_contrast";
    markdownConfig["theme.dark"] = "dark_tritanopia";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "default", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);
  });

  it("configures both Mermaid slots from the fixed theme in single mode", async () => {
    const memento = createMemento();
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "dark", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);
  });

  it("restores the user's global Mermaid settings when synchronization is disabled", async () => {
    const memento = createMemento();

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

  it("does not modify Mermaid settings when synchronization starts disabled", async () => {
    const memento = createMemento();
    markdownConfig["mermaid.syncTheme"] = false;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
  });

  it("does not modify settings when the Mermaid extension is not installed", async () => {
    const memento = createMemento();
    mermaidExtensionInstalled = false;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
  });

  it("does not modify settings when the Mermaid extension configuration is unavailable", async () => {
    const memento = createMemento();
    mermaidConfigurationRegistered = false;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
  });
});
