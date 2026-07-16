import type vscode from "vscode";
import MarkdownIt from "markdown-it";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestMemento } from "./helpers/memento";

const harness = vi.hoisted(() => ({
  commandHandlers: new Map<string, () => Promise<void>>(),
  configurationListener: undefined as
    | ((event: { affectsConfiguration(section: string): boolean }) => Promise<void>)
    | undefined,
  executeCalls: [] as string[],
  githubUpdates: [] as { key: string; value: unknown; target: unknown }[],
  informationMessages: [] as string[],
  markdownConfig: {} as Record<string, string | boolean>,
  mermaidGlobalConfig: {} as Record<string, string | undefined>,
  mermaidUpdates: [] as { key: string; value: string | undefined; target: number }[],
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
      }
    },
    window: {
      showQuickPick: async () => harness.quickPickResult,
      showInformationMessage: (message: string) => {
        harness.informationMessages.push(message);
      },
      showErrorMessage: vi.fn()
    },
    workspace: {
      getConfiguration: (namespace?: string) => {
        if (namespace === "markdown-mermaid") {
          return {
            inspect: (key: string) => ({ globalValue: harness.mermaidGlobalConfig[key] }),
            update: async (key: string, value: string | undefined, target: number) => {
              harness.mermaidUpdates.push({ key, value, target });
              harness.mermaidGlobalConfig[key] = value;
            }
          };
        }
        return {
          get: (key: string, defaultValue?: unknown) =>
            key in harness.markdownConfig ? harness.markdownConfig[key] : defaultValue,
          update: async (key: string, value: unknown, target: unknown) => {
            harness.githubUpdates.push({ key, value, target });
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

function createContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
    globalState: createTestMemento()
  } as unknown as vscode.ExtensionContext;
}

describe("extension lifecycle", () => {
  beforeEach(() => {
    harness.commandHandlers.clear();
    harness.configurationListener = undefined;
    harness.executeCalls.length = 0;
    harness.githubUpdates.length = 0;
    harness.informationMessages.length = 0;
    harness.mermaidUpdates.length = 0;
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
  });

  it("registers and owns commands and configuration events during activation", async () => {
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

  it("updates a theme through a registered command while treating cancellation as a no-op", async () => {
    const context = createContext();
    await activate(context);
    const command = harness.commandHandlers.get("vscode-github-markdown.changeThemeMode");

    await command?.();
    expect(harness.githubUpdates).toEqual([]);

    harness.quickPickResult = { label: "Single theme", value: "single" };
    await command?.();

    expect(harness.githubUpdates).toEqual([{ key: "theme.mode", value: "single", target: true }]);
    expect(harness.informationMessages).toEqual(["Theme mode changed to Single theme"]);
  });
});
