import type vscode from "vscode";
import MarkdownIt from "markdown-it";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestMemento } from "./helpers/memento";

const harness = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  configurationListener: undefined as
    | ((event: { affectsConfiguration(section: string): boolean }) => Promise<void>)
    | undefined,
  executeError: undefined as Error | undefined,
  executeCalls: [] as string[],
  errorMessages: [] as string[],
  githubUpdateError: undefined as Error | undefined,
  githubUpdates: [] as { key: string; value: unknown; target: unknown }[],
  informationMessages: [] as string[],
  markdownConfig: {} as Record<string, string | boolean>,
  mermaidGlobalConfig: {} as Record<string, string | undefined>,
  mermaidUpdateError: undefined as Error | undefined,
  mermaidUpdates: [] as { key: string; value: string | undefined; target: number }[],
  quickPickCalls: [] as {
    items: { label: string; value: string }[];
    options: { placeHolder?: string };
  }[],
  quickPickResult: undefined as { label: string; value: string } | undefined
}));

vi.mock("vscode", () => ({
  default: {
    ConfigurationTarget: { Global: 1 },
    extensions: {
      getExtension: (id: string) => (id === "vscode.mermaid-markdown-features" ? {} : undefined)
    },
    commands: {
      registerCommand: (id: string, handler: () => Promise<void>) => {
        harness.commandHandlers.set(id, handler);
        return { dispose: vi.fn() };
      },
      executeCommand: async (id: string) => {
        harness.executeCalls.push(id);
        if (harness.executeError) {
          throw harness.executeError;
        }
      }
    },
    window: {
      showQuickPick: async (
        items: { label: string; value: string }[],
        options: { placeHolder?: string }
      ) => {
        harness.quickPickCalls.push({ items, options });
        return harness.quickPickResult;
      },
      showInformationMessage: (message: string) => {
        harness.informationMessages.push(message);
      },
      showErrorMessage: (message: string) => {
        harness.errorMessages.push(message);
      }
    },
    workspace: {
      getConfiguration: (namespace?: string) => {
        if (namespace === "markdown-mermaid") {
          return {
            inspect: (key: string) => ({ globalValue: harness.mermaidGlobalConfig[key] }),
            update: async (key: string, value: string | undefined, target: number) => {
              harness.mermaidUpdates.push({ key, value, target });
              if (harness.mermaidUpdateError) {
                throw harness.mermaidUpdateError;
              }
              harness.mermaidGlobalConfig[key] = value;
            }
          };
        }
        return {
          get: (key: string, defaultValue?: unknown) =>
            key in harness.markdownConfig ? harness.markdownConfig[key] : defaultValue,
          update: async (key: string, value: unknown, target: unknown) => {
            harness.githubUpdates.push({ key, value, target });
            if (harness.githubUpdateError) {
              throw harness.githubUpdateError;
            }
            harness.markdownConfig[key] = value as string | boolean;
          }
        };
      },
      onDidChangeConfiguration: (
        listener: (event: { affectsConfiguration(section: string): boolean }) => Promise<void>
      ) => {
        harness.configurationListener = listener;
        return { dispose: vi.fn() };
      }
    }
  },
  l10n: {
    t: (message: string, ...args: (string | number)[]) =>
      message.replace(/\{(\d+)\}/g, (_match, index) => String(args[Number(index)] ?? ""))
  }
}));

import { activate, deactivate } from "../src/extension";
import { extendMarkdownIt } from "../src/markdown-it";

function createContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
    globalState: createTestMemento()
  } as unknown as vscode.ExtensionContext;
}

const themeModeItems = [
  { label: "Single theme", value: "single" },
  { label: "Sync with system", value: "system" },
  { label: "VS Code theme", value: "vscode" }
];

const themeItems = [
  { label: "Light", value: "light" },
  { label: "Light Protanopia & Deuteranopia", value: "light_colorblind" },
  { label: "Light high contrast", value: "light_high_contrast" },
  { label: "Light Tritanopia", value: "light_tritanopia" },
  { label: "Dark", value: "dark" },
  { label: "Dark Protanopia & Deuteranopia", value: "dark_colorblind" },
  { label: "Dark dimmed", value: "dark_dimmed" },
  { label: "Dark high contrast", value: "dark_high_contrast" },
  { label: "Dark Tritanopia", value: "dark_tritanopia" }
];

const themeCommandCases = [
  {
    commandId: "vscode-github-markdown.changeThemeMode",
    quickPickItems: themeModeItems,
    placeHolder: "Select a theme mode",
    newSelection: { label: "Single theme", value: "single" },
    currentSelection: { label: "VS Code theme", value: "vscode" },
    configurationKey: "theme.mode",
    successMessage: "Theme mode changed to Single theme"
  },
  {
    commandId: "vscode-github-markdown.changeSingleTheme",
    quickPickItems: themeItems,
    placeHolder: "Select a theme",
    newSelection: { label: "Dark dimmed", value: "dark_dimmed" },
    currentSelection: { label: "Light high contrast", value: "light_high_contrast" },
    configurationKey: "theme.single",
    successMessage: "Single theme changed to Dark dimmed."
  },
  {
    commandId: "vscode-github-markdown.changeLightTheme",
    quickPickItems: themeItems,
    placeHolder: "Select a light theme",
    newSelection: { label: "Light high contrast", value: "light_high_contrast" },
    currentSelection: { label: "Light Tritanopia", value: "light_tritanopia" },
    configurationKey: "theme.light",
    successMessage: "Light theme changed to Light high contrast."
  },
  {
    commandId: "vscode-github-markdown.changeDarkTheme",
    quickPickItems: themeItems,
    placeHolder: "Select a dark theme",
    newSelection: { label: "Dark dimmed", value: "dark_dimmed" },
    currentSelection: { label: "Dark Tritanopia", value: "dark_tritanopia" },
    configurationKey: "theme.dark",
    successMessage: "Dark theme changed to Dark dimmed."
  }
];

describe("extension lifecycle", () => {
  beforeEach(() => {
    harness.commandHandlers.clear();
    harness.configurationListener = undefined;
    harness.executeError = undefined;
    harness.executeCalls.length = 0;
    harness.errorMessages.length = 0;
    harness.githubUpdateError = undefined;
    harness.githubUpdates.length = 0;
    harness.informationMessages.length = 0;
    harness.mermaidUpdates.length = 0;
    harness.mermaidUpdateError = undefined;
    harness.quickPickCalls.length = 0;
    harness.quickPickResult = undefined;
    harness.markdownConfig = {
      "theme.mode": "system",
      "theme.single": "light",
      "theme.light": "light",
      "theme.dark": "dark",
      "mermaid.syncTheme": true
    };
    harness.mermaidGlobalConfig = {
      lightModeTheme: "neutral",
      darkModeTheme: "forest"
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers and owns commands, configuration events, and Markdown-It composition", async () => {
    const context = createContext();

    const api = await activate(context);

    expect([...harness.commandHandlers.keys()]).toEqual([
      "vscode-github-markdown.changeThemeMode",
      "vscode-github-markdown.changeSingleTheme",
      "vscode-github-markdown.changeLightTheme",
      "vscode-github-markdown.changeDarkTheme"
    ]);
    expect(harness.configurationListener).toBeTypeOf("function");
    expect(context.subscriptions).toHaveLength(5);
    expect(harness.mermaidUpdates).toHaveLength(2);
    expect(api).toEqual(expect.objectContaining({ extendMarkdownIt }));

    const html = api.extendMarkdownIt(new MarkdownIt({ html: true })).render("# Hello");
    expect(html).toContain('class="vscode-github-markdown"');
  });

  it("refreshes the preview and restores Mermaid settings when synchronization is disabled", async () => {
    const context = createContext();
    await activate(context);
    harness.markdownConfig["mermaid.syncTheme"] = false;
    harness.mermaidUpdates.length = 0;

    await harness.configurationListener?.({
      affectsConfiguration: (section) => section === "githubMarkdown"
    });

    expect(harness.mermaidUpdates).toEqual([
      { key: "lightModeTheme", value: "neutral", target: 1 },
      { key: "darkModeTheme", value: "forest", target: 1 }
    ]);
    expect(harness.executeCalls).toEqual(["markdown.preview.refresh"]);
  });

  it("ignores configuration changes outside the extension namespace", async () => {
    const context = createContext();
    await activate(context);
    harness.mermaidUpdates.length = 0;
    harness.executeCalls.length = 0;

    await harness.configurationListener?.({
      affectsConfiguration: () => false
    });

    expect(harness.mermaidUpdates).toEqual([]);
    expect(harness.executeCalls).toEqual([]);
  });

  it("refreshes the preview after Mermaid synchronization fails", async () => {
    const context = createContext();
    await activate(context);
    harness.mermaidUpdates.length = 0;
    harness.mermaidUpdateError = new Error("Mermaid update failed");

    await harness.configurationListener?.({
      affectsConfiguration: (section) => section === "githubMarkdown"
    });

    expect(harness.executeCalls).toEqual(["markdown.preview.refresh"]);
    expect(console.error).toHaveBeenCalledWith(
      "[github-markdown] Failed to sync Mermaid theme:",
      harness.mermaidUpdateError
    );
  });

  it("contains preview refresh failures inside the configuration listener", async () => {
    const context = createContext();
    await activate(context);
    harness.executeError = new Error("Preview refresh failed");

    await expect(
      harness.configurationListener?.({
        affectsConfiguration: (section) => section === "githubMarkdown"
      })
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "[github-markdown] Failed to refresh preview:",
      harness.executeError
    );
  });

  it("contains Mermaid synchronization failures during activation", async () => {
    const context = createContext();
    harness.mermaidUpdateError = new Error("Activation sync failed");

    await expect(activate(context)).resolves.toBeDefined();
    expect(console.error).toHaveBeenCalledWith(
      "[github-markdown] Failed to sync Mermaid theme on activation:",
      harness.mermaidUpdateError
    );
  });

  it("restores Mermaid settings when the extension is deactivated", async () => {
    const context = createContext();
    await activate(context);
    harness.mermaidUpdates.length = 0;

    await deactivate();

    expect(harness.mermaidUpdates).toEqual([
      { key: "lightModeTheme", value: "neutral", target: 1 },
      { key: "darkModeTheme", value: "forest", target: 1 }
    ]);
  });

  it("contains Mermaid restoration failures during deactivation", async () => {
    const context = createContext();
    await activate(context);
    harness.mermaidUpdateError = new Error("Deactivation restore failed");

    await expect(deactivate()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "[github-markdown] Failed to restore Mermaid theme on deactivation:",
      harness.mermaidUpdateError
    );
  });

  it("treats theme command cancellation as a no-op", async () => {
    const context = createContext();
    await activate(context);
    const command = harness.commandHandlers.get("vscode-github-markdown.changeThemeMode");

    await command?.();

    expect(harness.githubUpdates).toEqual([]);
    expect(harness.informationMessages).toEqual([]);
  });

  it.each(themeCommandCases)(
    "updates the expected configuration through $commandId",
    async ({
      commandId,
      quickPickItems,
      placeHolder,
      newSelection,
      configurationKey,
      successMessage
    }) => {
      const context = createContext();
      await activate(context);
      harness.quickPickResult = newSelection;
      const command = harness.commandHandlers.get(commandId);

      await command?.();

      expect(harness.quickPickCalls).toEqual([{ items: quickPickItems, options: { placeHolder } }]);
      expect(harness.githubUpdates).toEqual([
        { key: configurationKey, value: newSelection.value, target: true }
      ]);
      expect(harness.informationMessages).toEqual([successMessage]);
    }
  );

  it.each(themeCommandCases)(
    "does not rewrite the current value through $commandId",
    async ({ commandId, configurationKey, currentSelection }) => {
      harness.markdownConfig[configurationKey] = currentSelection.value;
      const context = createContext();
      await activate(context);
      harness.quickPickResult = currentSelection;
      const command = harness.commandHandlers.get(commandId);

      await command?.();

      expect(harness.githubUpdates).toEqual([]);
      expect(harness.informationMessages).toEqual([]);
    }
  );

  it("reports a theme configuration update failure without changing the active value", async () => {
    const context = createContext();
    await activate(context);
    const command = harness.commandHandlers.get("vscode-github-markdown.changeThemeMode");
    harness.quickPickResult = { label: "Single theme", value: "single" };
    harness.githubUpdateError = new Error("Configuration update failed");

    await expect(command?.()).resolves.toBeUndefined();

    expect(harness.markdownConfig["theme.mode"]).toBe("system");
    expect(harness.informationMessages).toEqual([]);
    expect(harness.errorMessages).toEqual(["Failed to change theme. See output for details."]);
  });
});
