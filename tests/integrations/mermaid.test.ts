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
let mermaidWorkspaceConfig: Record<string, string | undefined> = {};
let mermaidConfigurationRegistered = true;
let mermaidExtensionIds = new Set(["vscode.mermaid-markdown-features"]);

const updateCalls: { key: string; value: string | undefined; target: number }[] = [];
let updateFailures = new Set<string>();
let updateGates = new Map<string, Promise<void>>();
let updateFailureCalls = new Set<number>();
let updateGateCalls = new Map<number, Promise<void>>();

function getEffectiveMermaidConfig(): Record<string, string | undefined> {
  return {
    lightModeTheme:
      mermaidWorkspaceConfig["lightModeTheme"] ?? mermaidGlobalConfig["lightModeTheme"],
    darkModeTheme: mermaidWorkspaceConfig["darkModeTheme"] ?? mermaidGlobalConfig["darkModeTheme"]
  };
}

vi.mock("vscode", () => ({
  default: {
    ConfigurationTarget: { Global: 1, Workspace: 2 },
    extensions: {
      getExtension: (id: string) => (mermaidExtensionIds.has(id) ? {} : undefined)
    },
    workspace: {
      getConfiguration: (namespace?: string) => {
        if (namespace === "markdown-mermaid") {
          return {
            inspect: (key: string) =>
              mermaidConfigurationRegistered
                ? {
                    globalValue: mermaidGlobalConfig[key],
                    workspaceValue: mermaidWorkspaceConfig[key]
                  }
                : undefined,
            update: async (key: string, value: string | undefined, target: number) => {
              updateCalls.push({ key, value, target });
              const callNumber = updateCalls.length;
              if (updateFailures.has(key) || updateFailureCalls.has(callNumber)) {
                throw new Error(`Failed to update ${key}`);
              }
              const updateGate = updateGateCalls.get(callNumber) ?? updateGates.get(key);
              if (updateGate) {
                await updateGate;
              }
              if (target === 2) {
                mermaidWorkspaceConfig[key] = value;
              } else {
                mermaidGlobalConfig[key] = value;
              }
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

import { restoreMermaidThemeSync, updateMermaidThemeSync } from "../../src/integrations/mermaid";

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
    mermaidWorkspaceConfig = {};
    mermaidConfigurationRegistered = true;
    mermaidExtensionIds = new Set(["vscode.mermaid-markdown-features"]);
    updateFailures = new Set();
    updateGates = new Map();
    updateFailureCalls = new Set();
    updateGateCalls = new Map();
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

  it("synchronizes workspace Mermaid overrides without changing global settings", async () => {
    const memento = createTestMemento();
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };

    await updateMermaidThemeSync(memento);

    expect(getEffectiveMermaidConfig()).toEqual({
      lightModeTheme: "default",
      darkModeTheme: "dark"
    });
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
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

  it("uses the Mermaid VS Code theme for both slots in VS Code mode", async () => {
    const memento = createTestMemento();
    markdownConfig["theme.mode"] = "vscode";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "vscode", target: 1 },
      { key: "darkModeTheme", value: "vscode", target: 1 }
    ]);
  });

  it("keeps the latest theme request when overlapping updates would finish out of order", async () => {
    const memento = createTestMemento();
    let releaseFirstUpdate = () => {};
    const firstUpdateGate = new Promise<void>((resolve) => {
      releaseFirstUpdate = resolve;
    });
    updateGates.set("lightModeTheme", firstUpdateGate);
    updateGates.set("darkModeTheme", firstUpdateGate);

    const firstUpdate = updateMermaidThemeSync(memento);
    await vi.waitFor(() => expect(updateCalls).toHaveLength(2));

    markdownConfig["theme.mode"] = "vscode";
    updateGates.clear();
    const latestUpdate = updateMermaidThemeSync(memento);
    await Promise.resolve();
    await Promise.resolve();

    releaseFirstUpdate();
    await Promise.all([firstUpdate, latestUpdate]);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "vscode",
      darkModeTheme: "vscode"
    });
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

  it("restores workspace Mermaid overrides when synchronization is disabled", async () => {
    const memento = createTestMemento();
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };

    await updateMermaidThemeSync(memento);
    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);

    expect(getEffectiveMermaidConfig()).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    });
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
  });

  it("restores the original themes when disabling synchronization overlaps an update", async () => {
    const memento = createTestMemento();
    let releaseUpdate = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });
    updateGates.set("lightModeTheme", updateGate);
    updateGates.set("darkModeTheme", updateGate);

    const update = updateMermaidThemeSync(memento);
    await vi.waitFor(() => expect(updateCalls).toHaveLength(2));

    markdownConfig["mermaid.syncTheme"] = false;
    const restore = updateMermaidThemeSync(memento);
    await Promise.resolve();
    await Promise.resolve();

    releaseUpdate();
    await Promise.all([update, restore]);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
  });

  it("restores the original themes when deactivation overlaps an update", async () => {
    const memento = createTestMemento();
    let releaseUpdate = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });
    updateGates.set("lightModeTheme", updateGate);
    updateGates.set("darkModeTheme", updateGate);

    const update = updateMermaidThemeSync(memento);
    await vi.waitFor(() => expect(updateCalls).toHaveLength(2));

    const restore = restoreMermaidThemeSync(memento);
    await Promise.resolve();
    await Promise.resolve();

    releaseUpdate();
    await Promise.all([update, restore]);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
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

  it("does not overwrite workspace Mermaid choices made while synchronization was active", async () => {
    const memento = createTestMemento();
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };

    await updateMermaidThemeSync(memento);
    mermaidWorkspaceConfig["lightModeTheme"] = "forest";
    await restoreMermaidThemeSync(memento);

    expect(getEffectiveMermaidConfig()).toEqual({
      lightModeTheme: "forest",
      darkModeTheme: "vscode"
    });
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
  });

  it.each([
    ["darkModeTheme", "lightModeTheme"],
    ["lightModeTheme", "darkModeTheme"]
  ] as const)(
    "restores %s after the other theme update succeeds",
    async (failedKey, appliedKey) => {
      const memento = createTestMemento();
      let releaseAppliedUpdate = () => {};
      updateGates.set(
        appliedKey,
        new Promise<void>((resolve) => {
          releaseAppliedUpdate = resolve;
        })
      );
      updateFailures.add(failedKey);

      const synchronization = expect(updateMermaidThemeSync(memento)).rejects.toThrow(
        `Failed to update ${failedKey}`
      );
      await vi.waitFor(() => expect(updateCalls).toHaveLength(2));
      releaseAppliedUpdate();
      await synchronization;

      expect(mermaidGlobalConfig).toEqual({
        lightModeTheme: "neutral",
        darkModeTheme: "forest"
      });
    }
  );

  it("reports update and rollback failures while keeping the snapshot retryable", async () => {
    const memento = createTestMemento();
    let releaseLightUpdate = () => {};
    updateGates.set(
      "lightModeTheme",
      new Promise<void>((resolve) => {
        releaseLightUpdate = resolve;
      })
    );
    updateFailures.add("darkModeTheme");

    const synchronization = updateMermaidThemeSync(memento).catch((error: unknown) => error);
    await vi.waitFor(() => expect(updateCalls).toHaveLength(2));
    updateFailures.add("lightModeTheme");
    releaseLightUpdate();

    const error = await synchronization;
    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toEqual([
      expect.objectContaining({ message: "Failed to update darkModeTheme" }),
      expect.objectContaining({ message: "Failed to update lightModeTheme" })
    ]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "default",
      darkModeTheme: "forest"
    });

    updateFailures.clear();
    updateGates.clear();
    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
  });

  it("waits for every rollback before running the next synchronization", async () => {
    const memento = createTestMemento();
    await updateMermaidThemeSync(memento);

    markdownConfig["theme.mode"] = "vscode";
    let releaseDarkRollback = () => {};
    updateFailureCalls.add(4);
    updateFailureCalls.add(5);
    updateGateCalls.set(
      6,
      new Promise<void>((resolve) => {
        releaseDarkRollback = resolve;
      })
    );

    const failedSynchronization = expect(updateMermaidThemeSync(memento)).rejects.toBeInstanceOf(
      AggregateError
    );
    await vi.waitFor(() => expect(updateCalls).toHaveLength(6));

    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "light";
    const latestSynchronization = updateMermaidThemeSync(memento);
    await Promise.resolve();
    await Promise.resolve();
    expect(updateCalls).toHaveLength(6);

    releaseDarkRollback();
    await failedSynchronization;
    await latestSynchronization;

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "default",
      darkModeTheme: "default"
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
