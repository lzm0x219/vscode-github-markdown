import type { Frame, Locator, Page } from "playwright";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assertFinalClientRendering } from "../../../scripts/host/client-rendering";
import { assertClientRenderedPreview } from "../../../scripts/host/preview";

type MermaidPalette = {
  background: string;
  nodeFill: string;
  textColor: string;
};

const lightPalette: MermaidPalette = {
  background: "rgb(255, 255, 255)",
  nodeFill: "rgb(221, 238, 255)",
  textColor: "rgb(31, 35, 40)"
};
const darkPalette: MermaidPalette = {
  background: "rgb(13, 17, 23)",
  nodeFill: "rgb(22, 27, 34)",
  textColor: "rgb(230, 237, 243)"
};

afterEach(() => {
  vi.useRealTimers();
});

describe("assertClientRenderedPreview", () => {
  it("waits for system theme palettes when the first rendered sample is stale", async () => {
    vi.useFakeTimers();
    const preview = createThemePreviewPage();

    await expect(assertClientRenderedPreview(preview.page)).resolves.toBeUndefined();

    expect(preview.readPalette()).toEqual(darkPalette);
  });

  it("checks the code copy button across every GitHub theme and VS Code theme mode", async () => {
    vi.useFakeTimers();
    const preview = createThemePreviewPage();

    await expect(assertClientRenderedPreview(preview.page)).resolves.toBeUndefined();

    expect(preview.readSingleThemeSelections()).toEqual([
      "Light",
      "Light Protanopia & Deuteranopia",
      "Light high contrast",
      "Light Tritanopia",
      "Dark",
      "Dark Protanopia & Deuteranopia",
      "Dark dimmed",
      "Dark high contrast",
      "Dark Tritanopia"
    ]);
    expect(preview.readThemeModeSelections()).toContain("VS Code theme");
    expect(preview.readCopyButtonEvaluations()).toBe(10);
  });

  it("keeps checking themes when the host has no built-in code copy button", async () => {
    vi.useFakeTimers();
    const preview = createThemePreviewPage({ copyButtonAvailable: false });

    await expect(assertClientRenderedPreview(preview.page)).resolves.toBeUndefined();

    expect(preview.readSingleThemeSelections()).toHaveLength(9);
    expect(preview.readThemeModeSelections()).toContain("VS Code theme");
    expect(preview.readCopyButtonEvaluations()).toBe(0);
  });
});

describe("assertFinalClientRendering", () => {
  it("reacquires the preview when its frame reloads during the final assertions", async () => {
    const detachedFrame = createPreviewFrame({ detachDuringAssertion: true });
    const replacementFrame = createPreviewFrame();
    let frameReads = 0;
    const page = {
      frames() {
        frameReads += 1;
        return frameReads === 1 ? [detachedFrame] : [replacementFrame];
      },
      waitForTimeout: async () => {}
    } as unknown as Page;

    await expect(assertFinalClientRendering(page, 1_000)).resolves.toBeUndefined();
    expect(frameReads).toBe(2);
  });

  it("rejects a preview with a nested vertical scroll area", async () => {
    vi.useFakeTimers();
    const frame = createPreviewFrame({
      overflow: {
        pageScrollable: true,
        nestedVerticalScrollerLabels: ["katex-scroll"]
      }
    });
    const page = {
      frames: () => [frame],
      waitForTimeout: async (milliseconds: number) => {
        vi.advanceTimersByTime(milliseconds);
      }
    } as unknown as Page;

    const assertion = assertFinalClientRendering(page, 1_000);
    await expect(assertion).rejects.toThrow("second vertical scroll area");
  });
});

function createPreviewFrame({
  detachDuringAssertion = false,
  overflow = { pageScrollable: true, nestedVerticalScrollerLabels: [] as string[] }
}: {
  detachDuringAssertion?: boolean;
  overflow?: { pageScrollable: boolean; nestedVerticalScrollerLabels: string[] };
} = {}): Frame {
  return {
    locator(selector: string) {
      return {
        count: async () => 1,
        textContent: async () => {
          if (detachDuringAssertion && selector === ".mermaid svg") {
            throw new Error("Frame was detached");
          }
          if (selector === ".mermaid svg") return "Alpha Beta";
          if (selector.includes("annotation")) return "S_{12}";
          return "";
        },
        isVisible: async () => true,
        boundingBox: async () => ({ x: 0, y: 0, width: 100, height: 100 })
      } as unknown as Locator;
    },
    evaluate: async () => overflow,
    url: () => "vscode-webview://preview"
  } as unknown as Frame;
}

type ThemePreviewState = {
  activeCommand: string | undefined;
  body: "vscode-dark" | "vscode-light";
  copyButtonAvailable: boolean;
  copyButtonEvaluations: number;
  dark: string;
  inputValue: string;
  light: string;
  mode: "auto" | "dark" | "light" | "vscode";
  palette: MermaidPalette;
  pendingPalette: MermaidPalette | undefined;
  quickInputVisible: boolean;
  singleThemeSelections: string[];
  themeModeSelections: string[];
};

function createThemePreviewPage({
  copyButtonAvailable = true
}: { copyButtonAvailable?: boolean } = {}): {
  page: Page;
  readCopyButtonEvaluations: () => number;
  readPalette: () => MermaidPalette;
  readSingleThemeSelections: () => string[];
  readThemeModeSelections: () => string[];
} {
  const state: ThemePreviewState = {
    activeCommand: undefined,
    body: "vscode-light",
    copyButtonAvailable,
    copyButtonEvaluations: 0,
    dark: "dark",
    inputValue: "",
    light: "light",
    mode: "light",
    palette: lightPalette,
    pendingPalette: undefined,
    quickInputVisible: false,
    singleThemeSelections: [],
    themeModeSelections: []
  };
  const frame = createThemeFrame(state);
  const page = {
    frames: () => [frame],
    keyboard: {
      press: async (key: string) => {
        if (key === "Escape") state.quickInputVisible = false;
      }
    },
    locator: (selector: string) => createWorkbenchLocator(selector, state),
    waitForTimeout: async (milliseconds: number) => {
      if (state.pendingPalette) {
        state.palette = state.pendingPalette;
        state.pendingPalette = undefined;
      }
      vi.advanceTimersByTime(milliseconds);
    }
  } as unknown as Page;

  return {
    page,
    readCopyButtonEvaluations: () => state.copyButtonEvaluations,
    readPalette: () => state.palette,
    readSingleThemeSelections: () => [...state.singleThemeSelections],
    readThemeModeSelections: () => [...state.themeModeSelections]
  };
}

function createWorkbenchLocator(
  selector: string,
  state: ThemePreviewState,
  text?: string
): Locator {
  const locator = {
    click: async () => {
      if (!selector.includes(".monaco-list-row") || !text) return;
      if (state.inputValue.startsWith(">")) {
        state.activeCommand = text;
        if (!isQuickPickCommand(text)) state.quickInputVisible = false;
        return;
      }
      applyQuickPick(state, state.activeCommand, text);
      state.quickInputVisible = false;
    },
    fill: async (value: string) => {
      state.inputValue = value;
    },
    filter: ({ hasText }: { hasText: string }) => createWorkbenchLocator(selector, state, hasText),
    first: () => locator,
    getByText: (value: string) => createWorkbenchLocator(selector, state, value),
    isVisible: async () =>
      selector.includes(".quick-input-widget") ? state.quickInputVisible : true,
    locator: (child: string) => createWorkbenchLocator(`${selector} ${child}`, state),
    press: async (key: string) => {
      if (key === "F1") {
        state.quickInputVisible = true;
        state.activeCommand = undefined;
      }
    },
    waitFor: async () => {}
  };
  return locator as unknown as Locator;
}

function isQuickPickCommand(command: string): boolean {
  return (
    command === "GitHub Markdown: Change Light Theme" ||
    command === "GitHub Markdown: Change Dark Theme" ||
    command === "GitHub Markdown: Change Theme Mode" ||
    command === "GitHub Markdown: Change Single Theme" ||
    command === "Preferences: Color Theme"
  );
}

function applyQuickPick(
  state: ThemePreviewState,
  command: string | undefined,
  option: string
): void {
  if (command === "GitHub Markdown: Change Light Theme") {
    state.light = option === "Light high contrast" ? "light_high_contrast" : "light";
    return;
  }
  if (command === "GitHub Markdown: Change Dark Theme") {
    state.dark = option === "Dark Tritanopia" ? "dark_tritanopia" : "dark";
    return;
  }
  if (command === "GitHub Markdown: Change Theme Mode") {
    state.themeModeSelections.push(option);
    state.mode =
      option === "Sync with system" ? "auto" : option === "VS Code theme" ? "vscode" : "light";
    return;
  }
  if (command === "GitHub Markdown: Change Single Theme") {
    state.singleThemeSelections.push(option);
    applySingleTheme(state, option);
    return;
  }
  if (command === "Preferences: Color Theme") {
    const isLight = option === "Light Modern";
    state.body = isLight ? "vscode-light" : "vscode-dark";
    state.palette = isLight ? darkPalette : lightPalette;
    state.pendingPalette = isLight ? lightPalette : darkPalette;
  }
}

function applySingleTheme(state: ThemePreviewState, option: string): void {
  const cases: Record<
    string,
    { dark: string; light: string; mode: "dark" | "light"; palette: MermaidPalette }
  > = {
    Light: { dark: "dark", light: "light", mode: "light", palette: lightPalette },
    "Dark dimmed": {
      dark: "dark_dimmed",
      light: "light",
      mode: "dark",
      palette: darkPalette
    },
    "Light Protanopia & Deuteranopia": {
      dark: "dark",
      light: "light_colorblind",
      mode: "light",
      palette: { ...lightPalette, nodeFill: "rgb(219, 231, 255)" }
    },
    "Light high contrast": {
      dark: "dark",
      light: "light_high_contrast",
      mode: "light",
      palette: { ...lightPalette, nodeFill: "rgb(255, 255, 255)" }
    },
    "Light Tritanopia": {
      dark: "dark",
      light: "light_tritanopia",
      mode: "light",
      palette: { ...lightPalette, nodeFill: "rgb(224, 239, 255)" }
    },
    Dark: { dark: "dark", light: "light", mode: "dark", palette: darkPalette },
    "Dark Protanopia & Deuteranopia": {
      dark: "dark_colorblind",
      light: "light",
      mode: "dark",
      palette: darkPalette
    },
    "Dark high contrast": {
      dark: "dark_high_contrast",
      light: "light",
      mode: "dark",
      palette: darkPalette
    },
    "Dark Tritanopia": {
      dark: "dark_tritanopia",
      light: "light",
      mode: "dark",
      palette: darkPalette
    }
  };
  const selected = cases[option];
  if (!selected) throw new Error(`Unexpected single theme option: ${option}`);
  state.dark = selected.dark;
  state.light = selected.light;
  state.mode = selected.mode;
  state.palette = selected.palette;
}

function createThemeFrame(state: ThemePreviewState): Frame {
  return {
    evaluate: async () => ({
      pageScrollable: true,
      nestedVerticalScrollerLabels: []
    }),
    locator(selector: string) {
      const locator = {
        boundingBox: async () => ({ x: 0, y: 0, width: 100, height: 100 }),
        count: async () => countThemeSelector(selector, state),
        evaluate: async () => {
          if (selector === ".code-block-copy-button") {
            if (!state.copyButtonAvailable) throw new Error("Code copy button is unavailable");
            state.copyButtonEvaluations += 1;
            return {
              parentTag: "PRE",
              buttonPosition: "absolute",
              buttonTop: "8px",
              buttonRight: "8px",
              buttonColor: "muted",
              buttonBackground: "rgba(0, 0, 0, 0)",
              buttonBorderWidth: "0px",
              buttonBorderRadius: "6px",
              buttonWidth: "28px",
              buttonHeight: "28px",
              buttonOpacity: "1",
              svgBackground: "muted",
              svgMaskImage: "url(github-copy-icon)",
              copiedColor: "success",
              copiedMaskImage: "url(github-check-icon)",
              pathDisplay: "none",
              expectedMuted: "muted",
              expectedSuccess: "success",
              centerOffset: { x: 0, y: 0 }
            };
          }
          return state.palette;
        },
        evaluateAll: async () => [],
        first: () => locator,
        isVisible: async () => true,
        textContent: async () => {
          if (selector === ".mermaid svg") return "Alpha Beta";
          if (selector.includes("annotation")) return "S_{12}";
          return "";
        },
        waitFor: async () => {
          if (selector === ".code-block-copy-button" && !state.copyButtonAvailable) {
            throw new Error("Code copy button is unavailable");
          }
        }
      };
      return locator as unknown as Locator;
    },
    url: () => "vscode-webview://preview"
  } as unknown as Frame;
}

function countThemeSelector(selector: string, state: ThemePreviewState): number {
  if (selector === ".vscode-github-markdown") return 1;
  if (selector.startsWith(".vscode-github-markdown[")) {
    const expected =
      `.vscode-github-markdown[data-color-mode="${state.mode}"]` +
      `[data-light-theme="${state.light}"]` +
      `[data-dark-theme="${state.dark}"]`;
    return selector === expected ? 1 : 0;
  }
  if (selector === `body.${state.body}`) return 1;
  if (selector === ".mermaid svg[data-host-preview-stale]") return 0;
  if (selector === ".code-block-copy-button") return state.copyButtonAvailable ? 1 : 0;
  if (selector === ".mermaid svg" || selector === ".katex-display .katex") return 1;
  return 0;
}
