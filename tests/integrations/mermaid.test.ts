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
let workspaceIdentity = "file:///workspace-a.code-workspace";

const updateCalls: { key: string; value: string | undefined; target: number }[] = [];
let updateFailures = new Set<string>();
let updateGates = new Map<string, Promise<void>>();
let updateFailureCalls = new Set<number>();
let updateGateCalls = new Map<number, Promise<void>>();
let updateNoopCalls = new Set<number>();
let updateObservedValues = new Map<number, string | undefined>();

function getEffectiveMermaidConfig(): Record<string, string | undefined> {
  return {
    lightModeTheme:
      mermaidWorkspaceConfig["lightModeTheme"] ?? mermaidGlobalConfig["lightModeTheme"],
    darkModeTheme: mermaidWorkspaceConfig["darkModeTheme"] ?? mermaidGlobalConfig["darkModeTheme"]
  };
}

function createControlledMemento(
  onUpdate: (update: {
    callNumber: number;
    key: string;
    persist: () => Promise<void>;
    value: unknown;
  }) => Promise<void>
): {
  memento: ReturnType<typeof createTestMemento>;
  storedMemento: ReturnType<typeof createTestMemento>;
} {
  const storedMemento = createTestMemento();
  let callNumber = 0;
  const memento: typeof storedMemento = {
    get: <T>(key: string, defaultValue?: T) => storedMemento.get(key, defaultValue),
    update: async (key: string, value: unknown) => {
      callNumber += 1;
      await onUpdate({
        callNumber,
        key,
        persist: async () => storedMemento.update(key, value),
        value
      });
    },
    keys: () => storedMemento.keys()
  };
  return { memento, storedMemento };
}

vi.mock("vscode", () => ({
  default: {
    ConfigurationTarget: { Global: 1, Workspace: 2 },
    extensions: {
      getExtension: (id: string) => (mermaidExtensionIds.has(id) ? {} : undefined)
    },
    workspace: {
      get workspaceFile() {
        return { toString: () => workspaceIdentity };
      },
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
              if (updateNoopCalls.has(callNumber)) {
                return;
              }
              const observedValue = updateObservedValues.has(callNumber)
                ? updateObservedValues.get(callNumber)
                : value;
              if (target === 2) {
                mermaidWorkspaceConfig[key] = observedValue;
              } else {
                mermaidGlobalConfig[key] = observedValue;
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
    workspaceIdentity = "file:///workspace-a.code-workspace";
    updateFailures = new Set();
    updateGates = new Map();
    updateFailureCalls = new Set();
    updateGateCalls = new Map();
    updateNoopCalls = new Set();
    updateObservedValues = new Map();
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

  it("retries a fulfilled configuration write that did not reach its target", async () => {
    const memento = createTestMemento();
    updateNoopCalls.add(2);
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "dark", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "dark",
      darkModeTheme: "dark"
    });
    expect(memento.get("githubMarkdown.mermaid.themeState.v2.global.dark")).toEqual(
      expect.objectContaining({ applied: "dark" })
    );
  });

  it("does not retry over a third-party value observed after a configuration update", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    updateObservedValues.set(1, "base");

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "default", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "dark"
    });
    expect(memento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        releasedBy: "workspace:file:///workspace-a.code-workspace"
      })
    );
    expect(memento.get(lightStateKey)).not.toHaveProperty("pending");
    expect(memento.get(lightStateKey)).not.toHaveProperty("applied");
  });

  it("waits for the first configuration write to settle before starting the second", async () => {
    const memento = createTestMemento();
    let releaseFirstUpdate = () => {};
    updateGates.set(
      "lightModeTheme",
      new Promise<void>((resolve) => {
        releaseFirstUpdate = resolve;
      })
    );

    const synchronization = updateMermaidThemeSync(memento);
    await vi.waitFor(() => expect(updateCalls).toHaveLength(1));
    const callsBeforeFirstSettled = [...updateCalls];
    releaseFirstUpdate();
    await synchronization;

    expect(callsBeforeFirstSettled).toEqual([
      { key: "lightModeTheme", value: "default", target: 1 }
    ]);
    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "default", target: 1 },
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
    await vi.waitFor(() => expect(updateCalls).toHaveLength(1));

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
    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "neutral", target: 1 },
      { key: "darkModeTheme", value: "forest", target: 1 }
    ]);
  });

  it("allows another global-target workspace to restore a crashed owner's settings", async () => {
    const memento = createTestMemento();
    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "neutral", target: 1 },
      { key: "darkModeTheme", value: "forest", target: 1 }
    ]);
  });

  it("clears a global release so a later enable can capture and synchronize again", async () => {
    const memento = createTestMemento();
    await updateMermaidThemeSync(memento);
    mermaidGlobalConfig["lightModeTheme"] = "base";
    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "forest"
    });

    markdownConfig["mermaid.syncTheme"] = true;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "default", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);

    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "forest"
    });
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

  it("does not restore workspace overrides captured for another workspace", async () => {
    const memento = createTestMemento();
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };

    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "default",
      darkModeTheme: "dark"
    };
    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
    expect(mermaidWorkspaceConfig).toEqual({
      lightModeTheme: "default",
      darkModeTheme: "dark"
    });
  });

  it("keeps independent workspace snapshots when returning to earlier workspaces", async () => {
    const memento = createTestMemento();
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };
    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "neutral",
      darkModeTheme: "base"
    };
    await updateMermaidThemeSync(memento);

    expect(
      memento.keys().filter((key) => key.includes("mermaid.themeState.v2.workspace"))
    ).toHaveLength(4);

    workspaceIdentity = "file:///workspace-a.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "default",
      darkModeTheme: "dark"
    };
    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);

    expect(mermaidWorkspaceConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    });

    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "default",
      darkModeTheme: "dark"
    };
    await updateMermaidThemeSync(memento);

    expect(mermaidWorkspaceConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "base"
    });
  });

  it("re-resolves the Mermaid targets after the extension host changes workspaces", async () => {
    const memento = createTestMemento();
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };

    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {};
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "default", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);

    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
  });

  it("adopts workspace targets after leaving a workspace that used global themes", async () => {
    const memento = createTestMemento();

    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "default", target: 2 },
      { key: "darkModeTheme", value: "dark", target: 2 }
    ]);

    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);

    expect(mermaidWorkspaceConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    });
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });

    workspaceIdentity = "file:///workspace-a.code-workspace";
    mermaidWorkspaceConfig = {};
    await updateMermaidThemeSync(memento);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
  });

  it("restores global snapshots created before workspace targets were recorded", async () => {
    const memento = createTestMemento();
    await memento.update("githubMarkdown.mermaid.originalGlobalThemes", {
      light: "neutral",
      dark: "forest",
      applied: {
        light: "default",
        dark: "dark"
      }
    });
    mermaidGlobalConfig = {
      lightModeTheme: "default",
      darkModeTheme: "dark"
    };
    markdownConfig["mermaid.syncTheme"] = false;

    await updateMermaidThemeSync(memento);

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
  });

  it("migrates a workspace snapshot without exposing it to another workspace", async () => {
    const memento = createTestMemento();
    await memento.update("githubMarkdown.mermaid.originalGlobalThemes", {
      light: "base",
      dark: "vscode",
      workspaceIdentity: "workspace:file:///workspace-a.code-workspace",
      targets: {
        light: 2,
        dark: 2
      },
      applied: {
        light: "default",
        dark: "dark"
      }
    });
    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "default",
      darkModeTheme: "dark"
    };
    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);

    workspaceIdentity = "file:///workspace-a.code-workspace";
    await updateMermaidThemeSync(memento);

    expect(mermaidWorkspaceConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    });
  });

  it("stops synchronizing a Mermaid slot after the user changes that target", async () => {
    const memento = createTestMemento();

    await updateMermaidThemeSync(memento);
    mermaidGlobalConfig["lightModeTheme"] = "base";
    markdownConfig["theme.mode"] = "vscode";
    updateCalls.length = 0;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "vscode", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    });

    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "forest", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "forest"
    });
  });

  it("keeps a global user takeover across workspaces that use workspace overrides", async () => {
    const memento = createTestMemento();

    await updateMermaidThemeSync(memento);
    mermaidGlobalConfig["lightModeTheme"] = "base";
    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "neutral",
      darkModeTheme: "vscode"
    };
    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-c.code-workspace";
    mermaidWorkspaceConfig = {};
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "dark", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "dark"
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
    await vi.waitFor(() => expect(updateCalls).toHaveLength(1));

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
    await vi.waitFor(() => expect(updateCalls).toHaveLength(1));

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

  it("restores owned global and current workspace themes when synchronization stops after a target switch", async () => {
    const memento = createTestMemento();
    await updateMermaidThemeSync(memento);

    workspaceIdentity = "file:///workspace-b.code-workspace";
    mermaidWorkspaceConfig = {
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    };
    await updateMermaidThemeSync(memento);

    markdownConfig["mermaid.syncTheme"] = false;
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "neutral", target: 1 },
      { key: "lightModeTheme", value: "base", target: 2 },
      { key: "darkModeTheme", value: "forest", target: 1 },
      { key: "darkModeTheme", value: "vscode", target: 2 }
    ]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
    expect(mermaidWorkspaceConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "vscode"
    });
  });

  it("resumes synchronization after restoration wrote configuration before state cleanup", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    await memento.update(lightStateKey, {
      version: 2,
      revision: "workspace-a:1",
      target: "global",
      original: "neutral",
      applied: "dark",
      owner: "workspace:file:///workspace-a.code-workspace",
      pending: {
        kind: "restore",
        desired: "neutral",
        previous: "dark"
      }
    });
    await memento.update("githubMarkdown.mermaid.themeState.v2.global.dark", {
      version: 2,
      revision: "workspace-a:2",
      target: "global",
      original: "forest",
      releasedBy: "workspace:file:///workspace-a.code-workspace"
    });
    mermaidGlobalConfig["lightModeTheme"] = "neutral";
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "lightModeTheme", value: "dark", target: 1 }]);
    expect(mermaidGlobalConfig["lightModeTheme"]).toBe("dark");
    expect(memento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        applied: "dark"
      })
    );
    expect(memento.get(lightStateKey)).not.toHaveProperty("pending");
    expect(memento.get(lightStateKey)).not.toHaveProperty("releasedBy");
  });

  it("resumes synchronization after restoration was claimed before its configuration write", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    await memento.update(lightStateKey, {
      version: 2,
      revision: "workspace-a:1",
      target: "global",
      original: "neutral",
      applied: "dark",
      owner: "workspace:file:///workspace-a.code-workspace",
      pending: {
        kind: "restore",
        desired: "neutral",
        previous: "dark"
      }
    });
    await memento.update("githubMarkdown.mermaid.themeState.v2.global.dark", {
      version: 2,
      revision: "workspace-a:2",
      target: "global",
      original: "forest",
      releasedBy: "workspace:file:///workspace-a.code-workspace"
    });
    mermaidGlobalConfig["lightModeTheme"] = "dark";
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "lightModeTheme", value: "dark", target: 1 }]);
    expect(memento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        applied: "dark",
        owner: "workspace:file:///workspace-a.code-workspace"
      })
    );
    expect(memento.get(lightStateKey)).not.toHaveProperty("pending");
    expect(memento.get(lightStateKey)).not.toHaveProperty("releasedBy");
  });

  it("persists restoration intent before writing configuration", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    await updateMermaidThemeSync(memento);
    updateCalls.length = 0;
    let releaseUpdates = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdates = resolve;
    });
    updateGates.set("lightModeTheme", updateGate);
    updateGates.set("darkModeTheme", updateGate);

    const restoration = restoreMermaidThemeSync(memento);
    await vi.waitFor(() => expect(updateCalls).toHaveLength(1));
    const persistedBeforeWrite = memento.get(lightStateKey);
    releaseUpdates();
    await restoration;

    expect(persistedBeforeWrite).toEqual(
      expect.objectContaining({
        applied: "default",
        pending: {
          kind: "restore",
          desired: "neutral",
          previous: "default"
        }
      })
    );
  });

  it("retries synchronization after an apply was claimed before its configuration write", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    await memento.update(lightStateKey, {
      version: 2,
      revision: "workspace-a:1",
      target: "global",
      original: "neutral",
      applied: "default",
      owner: "workspace:file:///workspace-a.code-workspace",
      pending: {
        kind: "apply",
        desired: "dark",
        previous: "default"
      }
    });
    await memento.update("githubMarkdown.mermaid.themeState.v2.global.dark", {
      version: 2,
      revision: "workspace-a:2",
      target: "global",
      original: "forest",
      releasedBy: "workspace:file:///workspace-a.code-workspace"
    });
    mermaidGlobalConfig["lightModeTheme"] = "default";
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "lightModeTheme", value: "dark", target: 1 }]);
    expect(mermaidGlobalConfig["lightModeTheme"]).toBe("dark");
    expect(memento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        applied: "dark",
        owner: "workspace:file:///workspace-a.code-workspace"
      })
    );
    expect(memento.get(lightStateKey)).not.toHaveProperty("pending");
    expect(memento.get(lightStateKey)).not.toHaveProperty("releasedBy");
  });

  it("persists apply intent before writing configuration", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    let releaseUpdates = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdates = resolve;
    });
    updateGates.set("lightModeTheme", updateGate);
    updateGates.set("darkModeTheme", updateGate);

    const synchronization = updateMermaidThemeSync(memento);
    await vi.waitFor(() => expect(updateCalls).toHaveLength(1));
    const persistedBeforeWrite = memento.get(lightStateKey);
    releaseUpdates();
    await synchronization;

    expect(persistedBeforeWrite).toEqual(
      expect.objectContaining({
        original: "neutral",
        pending: {
          kind: "apply",
          desired: "default",
          previous: "neutral"
        }
      })
    );
  });

  it("preserves a user takeover while the apply claim is being persisted", async () => {
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    let releaseClaim = () => {};
    const claimGate = new Promise<void>((resolve) => {
      releaseClaim = resolve;
    });
    let shouldGateClaim = true;
    const { memento, storedMemento } = createControlledMemento(async ({ key, persist }) => {
      await persist();
      if (key === lightStateKey && shouldGateClaim) {
        shouldGateClaim = false;
        await claimGate;
      }
    });

    const synchronization = updateMermaidThemeSync(memento);
    await vi.waitFor(() =>
      expect(storedMemento.get(lightStateKey)).toEqual(
        expect.objectContaining({
          pending: { kind: "apply", desired: "default", previous: "neutral" }
        })
      )
    );
    mermaidGlobalConfig["lightModeTheme"] = "base";
    releaseClaim();
    await synchronization;

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "dark", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "dark"
    });
    expect(storedMemento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        releasedBy: "workspace:file:///workspace-a.code-workspace"
      })
    );
    expect(storedMemento.get(lightStateKey)).not.toHaveProperty("pending");
    expect(storedMemento.get(lightStateKey)).not.toHaveProperty("applied");
  });

  it("keeps a released takeover when another configuration update fails", async () => {
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    let releaseClaim = () => {};
    const claimGate = new Promise<void>((resolve) => {
      releaseClaim = resolve;
    });
    let shouldGateClaim = true;
    const { memento, storedMemento } = createControlledMemento(async ({ key, persist }) => {
      await persist();
      if (key === lightStateKey && shouldGateClaim) {
        shouldGateClaim = false;
        await claimGate;
      }
    });
    updateFailures.add("darkModeTheme");

    const synchronization = updateMermaidThemeSync(memento);
    await vi.waitFor(() =>
      expect(storedMemento.get(lightStateKey)).toEqual(
        expect.objectContaining({
          pending: { kind: "apply", desired: "default", previous: "neutral" }
        })
      )
    );
    mermaidGlobalConfig["lightModeTheme"] = "base";
    releaseClaim();
    await expect(synchronization).rejects.toThrow("Failed to update darkModeTheme");

    expect(storedMemento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        releasedBy: "workspace:file:///workspace-a.code-workspace"
      })
    );

    updateFailures.clear();
    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "dark", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "dark"
    });
  });

  it("keeps a takeover when persisting its released state fails", async () => {
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    let releaseClaim = () => {};
    const claimGate = new Promise<void>((resolve) => {
      releaseClaim = resolve;
    });
    let shouldGateClaim = true;
    let shouldRejectRelease = true;
    const { memento, storedMemento } = createControlledMemento(async ({ key, persist, value }) => {
      if (
        key === lightStateKey &&
        shouldRejectRelease &&
        typeof value === "object" &&
        value !== null &&
        "releasedBy" in value
      ) {
        shouldRejectRelease = false;
        throw new Error("Failed to persist released Mermaid state");
      }
      await persist();
      if (key === lightStateKey && shouldGateClaim) {
        shouldGateClaim = false;
        await claimGate;
      }
    });

    const synchronization = updateMermaidThemeSync(memento);
    await vi.waitFor(() =>
      expect(storedMemento.get(lightStateKey)).toEqual(
        expect.objectContaining({
          pending: { kind: "apply", desired: "default", previous: "neutral" }
        })
      )
    );
    mermaidGlobalConfig["lightModeTheme"] = "base";
    releaseClaim();
    await expect(synchronization).rejects.toThrow("Failed to persist released Mermaid state");

    expect(storedMemento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        releasedBy: "workspace:file:///workspace-a.code-workspace"
      })
    );

    updateCalls.length = 0;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "dark", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "dark"
    });
  });

  it("keeps a released takeover when another transaction fails to finalize", async () => {
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    let releaseClaim = () => {};
    const claimGate = new Promise<void>((resolve) => {
      releaseClaim = resolve;
    });
    const { memento, storedMemento } = createControlledMemento(async ({ callNumber, persist }) => {
      if (callNumber === 4) throw new Error("Failed to finalize Mermaid state");
      await persist();
      if (callNumber === 1) await claimGate;
    });

    const synchronization = updateMermaidThemeSync(memento);
    await vi.waitFor(() =>
      expect(storedMemento.get(lightStateKey)).toEqual(
        expect.objectContaining({
          pending: { kind: "apply", desired: "default", previous: "neutral" }
        })
      )
    );
    mermaidGlobalConfig["lightModeTheme"] = "base";
    releaseClaim();
    await expect(synchronization).rejects.toThrow("Failed to finalize Mermaid state");

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "base",
      darkModeTheme: "forest"
    });
    expect(storedMemento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        releasedBy: "workspace:file:///workspace-a.code-workspace"
      })
    );
  });

  it("finalizes synchronization after an apply wrote configuration before state cleanup", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    await memento.update(lightStateKey, {
      version: 2,
      revision: "workspace-a:1",
      target: "global",
      original: "neutral",
      applied: "default",
      owner: "workspace:file:///workspace-a.code-workspace",
      pending: {
        kind: "apply",
        desired: "dark",
        previous: "default"
      }
    });
    await memento.update("githubMarkdown.mermaid.themeState.v2.global.dark", {
      version: 2,
      revision: "workspace-a:2",
      target: "global",
      original: "forest",
      releasedBy: "workspace:file:///workspace-a.code-workspace"
    });
    mermaidGlobalConfig["lightModeTheme"] = "dark";
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "lightModeTheme", value: "dark", target: 1 }]);
    expect(memento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        applied: "dark",
        owner: "workspace:file:///workspace-a.code-workspace"
      })
    );
    expect(memento.get(lightStateKey)).not.toHaveProperty("pending");
    expect(memento.get(lightStateKey)).not.toHaveProperty("releasedBy");
  });

  it("restores an apply that wrote configuration before synchronization was disabled", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    await memento.update(lightStateKey, {
      version: 2,
      revision: "workspace-a:1",
      target: "global",
      original: "neutral",
      applied: "default",
      owner: "workspace:file:///workspace-a.code-workspace",
      pending: {
        kind: "apply",
        desired: "dark",
        previous: "default"
      }
    });
    await memento.update("githubMarkdown.mermaid.themeState.v2.global.dark", {
      version: 2,
      revision: "workspace-a:2",
      target: "global",
      original: "forest",
      releasedBy: "workspace:file:///workspace-a.code-workspace"
    });
    mermaidGlobalConfig["lightModeTheme"] = "dark";
    markdownConfig["mermaid.syncTheme"] = false;

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "lightModeTheme", value: "neutral", target: 1 }]);
    expect(mermaidGlobalConfig["lightModeTheme"]).toBe("neutral");
    expect(memento.get(lightStateKey)).toBeUndefined();
  });

  it("releases a pending apply when the user changes configuration back to its original value", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    await memento.update(lightStateKey, {
      version: 2,
      revision: "workspace-a:1",
      target: "global",
      original: "neutral",
      applied: "default",
      owner: "workspace:file:///workspace-a.code-workspace",
      pending: {
        kind: "apply",
        desired: "dark",
        previous: "default"
      }
    });
    await memento.update("githubMarkdown.mermaid.themeState.v2.global.dark", {
      version: 2,
      revision: "workspace-a:2",
      target: "global",
      original: "forest",
      releasedBy: "workspace:file:///workspace-a.code-workspace"
    });
    mermaidGlobalConfig["lightModeTheme"] = "neutral";
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([]);
    expect(mermaidGlobalConfig["lightModeTheme"]).toBe("neutral");
    expect(memento.get(lightStateKey)).toEqual(
      expect.objectContaining({
        original: "neutral",
        releasedBy: "workspace:file:///workspace-a.code-workspace"
      })
    );
    expect(memento.get(lightStateKey)).not.toHaveProperty("pending");
    expect(memento.get(lightStateKey)).not.toHaveProperty("applied");
    expect(memento.get(lightStateKey)).not.toHaveProperty("owner");
  });

  it("does not roll back a completed single-host write when Memento reads lag an update", async () => {
    const storedMemento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    const darkStateKey = "githubMarkdown.mermaid.themeState.v2.global.dark";
    await storedMemento.update(lightStateKey, {
      version: 2,
      revision: "initial-light",
      target: "global",
      applied: "default"
    });
    await storedMemento.update(darkStateKey, {
      version: 2,
      revision: "initial-dark",
      target: "global",
      applied: "default"
    });
    const staleReads = new Map<string, unknown>();
    const memento: typeof storedMemento = {
      get: <T>(key: string, defaultValue?: T) => {
        if (staleReads.has(key)) {
          const stale = staleReads.get(key) as T;
          staleReads.delete(key);
          return stale;
        }
        return storedMemento.get(key, defaultValue);
      },
      update: async (key: string, value: unknown) => {
        const previous = storedMemento.get(key);
        await storedMemento.update(key, value);
        if (key === lightStateKey || key === darkStateKey) staleReads.set(key, previous);
      },
      keys: () => storedMemento.keys()
    };
    mermaidGlobalConfig = { lightModeTheme: "default", darkModeTheme: "default" };
    markdownConfig["theme.mode"] = "single";
    markdownConfig["theme.single"] = "dark_dimmed";

    await expect(updateMermaidThemeSync(memento)).resolves.toBeUndefined();

    expect(updateCalls).toEqual([
      { key: "lightModeTheme", value: "dark", target: 1 },
      { key: "darkModeTheme", value: "dark", target: 1 }
    ]);
    expect(mermaidGlobalConfig).toEqual({ lightModeTheme: "dark", darkModeTheme: "dark" });
    expect(storedMemento.get(lightStateKey)).not.toHaveProperty("revision");
    expect(storedMemento.get(darkStateKey)).not.toHaveProperty("revision");
  });

  it("removes an earlier state claim when persisting the next claim fails", async () => {
    const storedMemento = createTestMemento();
    let updateCount = 0;
    const memento: typeof storedMemento = {
      get: <T>(key: string, defaultValue?: T) => storedMemento.get(key, defaultValue),
      update: async (key: string, value: unknown) => {
        if (++updateCount === 2) throw new Error("Failed to persist Mermaid state");
        await storedMemento.update(key, value);
      },
      keys: () => storedMemento.keys()
    };

    await expect(updateMermaidThemeSync(memento)).rejects.toThrow(
      "Failed to persist Mermaid state"
    );

    expect(updateCalls).toEqual([]);
    expect(storedMemento.keys()).toEqual([]);
  });

  it("rolls back configuration and state when final state persistence fails", async () => {
    const storedMemento = createTestMemento();
    let updateCount = 0;
    const memento: typeof storedMemento = {
      get: <T>(key: string, defaultValue?: T) => storedMemento.get(key, defaultValue),
      update: async (key: string, value: unknown) => {
        if (++updateCount === 3) throw new Error("Failed to finalize Mermaid state");
        await storedMemento.update(key, value);
      },
      keys: () => storedMemento.keys()
    };

    await expect(updateMermaidThemeSync(memento)).rejects.toThrow(
      "Failed to finalize Mermaid state"
    );

    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
    expect(storedMemento.keys()).toEqual([]);
  });

  it("keeps rollback intent when final state persistence and one configuration rollback fail", async () => {
    const storedMemento = createTestMemento();
    let updateCount = 0;
    const memento: typeof storedMemento = {
      get: <T>(key: string, defaultValue?: T) => storedMemento.get(key, defaultValue),
      update: async (key: string, value: unknown) => {
        if (++updateCount === 3) throw new Error("Failed to finalize Mermaid state");
        await storedMemento.update(key, value);
      },
      keys: () => storedMemento.keys()
    };
    updateFailureCalls.add(4);

    const error = await updateMermaidThemeSync(memento).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toEqual([
      expect.objectContaining({ message: "Failed to finalize Mermaid state" }),
      expect.objectContaining({ message: "Failed to update darkModeTheme" })
    ]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "dark"
    });
    expect(storedMemento.get("githubMarkdown.mermaid.themeState.v2.global.light")).toBeUndefined();
    expect(storedMemento.get("githubMarkdown.mermaid.themeState.v2.global.dark")).toEqual(
      expect.objectContaining({
        pending: { kind: "apply", desired: "dark", previous: "forest" }
      })
    );

    updateFailureCalls.clear();
    updateCalls.length = 0;
    markdownConfig["mermaid.syncTheme"] = false;
    await updateMermaidThemeSync(memento);

    expect(updateCalls).toEqual([{ key: "darkModeTheme", value: "forest", target: 1 }]);
    expect(mermaidGlobalConfig).toEqual({
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    });
    expect(storedMemento.keys()).toEqual([]);
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
      await vi.waitFor(() =>
        expect(updateCalls).toHaveLength(failedKey === "darkModeTheme" ? 1 : 2)
      );
      releaseAppliedUpdate();
      await synchronization;

      expect(mermaidGlobalConfig).toEqual({
        lightModeTheme: "neutral",
        darkModeTheme: "forest"
      });
    }
  );

  it("persists rollback intent before restoring a partially applied synchronization", async () => {
    const memento = createTestMemento();
    const lightStateKey = "githubMarkdown.mermaid.themeState.v2.global.light";
    let releaseRollback = () => {};
    updateFailureCalls.add(2);
    updateGateCalls.set(
      3,
      new Promise<void>((resolve) => {
        releaseRollback = resolve;
      })
    );

    const synchronization = expect(updateMermaidThemeSync(memento)).rejects.toThrow(
      "Failed to update darkModeTheme"
    );
    await vi.waitFor(() => expect(updateCalls).toHaveLength(3));
    const persistedBeforeRollback = memento.get(lightStateKey);
    releaseRollback();
    await synchronization;

    expect(persistedBeforeRollback).toEqual(
      expect.objectContaining({
        applied: "default",
        pending: {
          kind: "restore",
          desired: "neutral",
          previous: "default"
        }
      })
    );
  });

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
    await vi.waitFor(() => expect(updateCalls).toHaveLength(1));
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
