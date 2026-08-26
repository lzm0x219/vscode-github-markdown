import type { Frame, Locator, Page } from "playwright";
import { assertFinalClientRendering } from "./client-rendering";

const quickInputTimeoutMs = 5_000;
const maxCommandAttempts = 3;
const themeSettleAttemptTimeoutMs = 10_000;
const maxThemeAttempts = 3;

export async function assertClientRenderedPreview(page: Page): Promise<void> {
  await page.locator(".monaco-workbench").waitFor({ state: "visible", timeout: 30_000 });

  await openFile(page, "client-rendering.md");
  await runCommand(page, "Markdown: Open Preview to the Side");

  await assertFinalClientRendering(page);
  await assertThemeRendering(page);

  await openFile(page, "gfm-semantics.md");
  await runCommand(page, "Markdown: Open Preview to the Side");
  await assertGfmSemanticRendering(page);
}

export type GfmSemanticDom = {
  available: boolean;
  strikethrough: {
    single: boolean;
    double: boolean;
    escaped: boolean;
    inlineCode: boolean;
    unmatched: boolean;
    longRun: boolean;
  };
  tagfilter: {
    filteredTags: Record<string, boolean>;
    allowedStrong: boolean;
    details: boolean;
    picture: boolean;
  };
  directionality: {
    heading: boolean;
    paragraph: boolean;
    list: boolean;
    alert: boolean;
    footnoteReference: boolean;
    footnoteDefinition: boolean;
    explicit: boolean;
    inlineCodeHasDirection: boolean;
    fencedCodeHasDirection: boolean;
  };
  footnotes: {
    reference: boolean;
    section: boolean;
    backreference: boolean;
  };
};

export async function assertGfmSemanticRendering(page: Page, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const snapshot = await readGfmSemanticDom(frame);
        if (!snapshot?.available) continue;
        assertGfmSemanticDom(snapshot);
        return;
      } catch (error) {
        lastError = error;
        if (error instanceof GfmSemanticAssertionError) throw error;
        // Preview frames can be replaced while the Markdown renderer commits its DOM.
      }
    }
    await page.waitForTimeout(100);
  }

  const detail = lastError instanceof Error ? ` Last renderer error: ${lastError.message}.` : "";
  throw new Error(`Host preview test failed: final GFM semantic DOM was not found.${detail}`);
}

async function readGfmSemanticDom(frame: Frame): Promise<GfmSemanticDom | undefined> {
  return frame.evaluate(() => {
    const root = document.querySelector<HTMLElement>(".vscode-github-markdown");
    if (!root) return undefined;

    const markerElement = (selector: string, marker: string): Element | undefined =>
      [...root.querySelectorAll(selector)].find((element) => element.textContent?.includes(marker));
    const markerContainerHasElement = (marker: string, selector: string): boolean =>
      Boolean(markerElement("p", marker)?.querySelector(selector));
    const markerText = (marker: string): boolean => root.textContent?.includes(marker) ?? false;
    const codeWithMarker = (marker: string): Element | undefined =>
      [...root.querySelectorAll("code")].find((element) => element.textContent?.includes(marker));
    const fencedCode = codeWithMarker("host-gfm-fenced-code");
    const fencedPre = fencedCode?.closest("pre");
    const filteredTags = [
      "title",
      "textarea",
      "style",
      "xmp",
      "iframe",
      "noembed",
      "noframes",
      "script",
      "plaintext"
    ];

    return {
      available: Boolean(markerElement("h1", "host-gfm-heading")),
      strikethrough: {
        single: markerContainerHasElement("host-gfm-single", "del"),
        double: markerContainerHasElement("host-gfm-double", "s"),
        escaped: markerText("host-gfm-escaped ~escaped-tilde~."),
        inlineCode: [...root.querySelectorAll("code")].some(
          (element) => element.textContent === "~code-tilde~"
        ),
        unmatched: markerText("host-gfm-unmatched ~unmatched-tilde."),
        longRun: markerText("host-gfm-long ~~~long-tilde~~~.")
      },
      tagfilter: {
        filteredTags: Object.fromEntries(
          filteredTags.map((tag) => [tag, root.querySelectorAll(tag).length === 0])
        ),
        allowedStrong: Boolean(
          root.querySelector('strong[data-gfm-allowed="strong"]')?.textContent === "host-gfm-strong"
        ),
        details: Boolean(markerElement("details", "host-gfm-details")),
        picture: Boolean(root.querySelector('picture img[alt="host-gfm-picture"]'))
      },
      directionality: {
        heading: markerElement("h1", "host-gfm-heading")?.getAttribute("dir") === "auto",
        paragraph: markerElement("p", "host-gfm-paragraph")?.getAttribute("dir") === "auto",
        list: markerElement("ul", "host-gfm-list")?.getAttribute("dir") === "auto",
        alert:
          markerElement("div.markdown-alert", "host-gfm-alert")?.getAttribute("dir") === "auto",
        footnoteReference:
          markerElement("p", "host-gfm-footnote-reference")?.getAttribute("dir") === "auto",
        footnoteDefinition:
          markerElement("p", "host-gfm-footnote-definition")?.getAttribute("dir") === "auto",
        explicit:
          markerElement('p[data-gfm-direction="explicit"]', "host-gfm-explicit-rtl")?.getAttribute(
            "dir"
          ) === "rtl",
        inlineCodeHasDirection: Boolean(
          codeWithMarker("host-gfm-inline-code")?.hasAttribute("dir")
        ),
        fencedCodeHasDirection: Boolean(
          fencedCode?.hasAttribute("dir") || fencedPre?.hasAttribute("dir")
        )
      },
      footnotes: {
        reference: Boolean(root.querySelector("[data-footnote-ref]")),
        section: Boolean(root.querySelector("section[data-footnotes]")),
        backreference: Boolean(root.querySelector("[data-footnote-backref]"))
      }
    } satisfies GfmSemanticDom;
  });
}

export function assertGfmSemanticDom(snapshot: GfmSemanticDom): void {
  const missing = [
    [snapshot.strikethrough.single, "single-tilde strikethrough renders <del>"],
    [snapshot.strikethrough.double, "double-tilde strikethrough renders <s>"],
    [snapshot.strikethrough.escaped, "escaped tildes remain literal"],
    [snapshot.strikethrough.inlineCode, "inline code keeps tildes literal"],
    [snapshot.strikethrough.unmatched, "unmatched tildes remain literal"],
    [snapshot.strikethrough.longRun, "long tilde runs remain literal"],
    [snapshot.tagfilter.allowedStrong, "allowed strong HTML remains rendered"],
    [snapshot.tagfilter.details, "details remains rendered"],
    [snapshot.tagfilter.picture, "picture remains rendered"],
    [snapshot.directionality.heading, "heading uses automatic direction"],
    [snapshot.directionality.paragraph, "paragraph uses automatic direction"],
    [snapshot.directionality.list, "list uses automatic direction"],
    [snapshot.directionality.alert, "alert uses automatic direction"],
    [snapshot.directionality.footnoteReference, "footnote reference uses automatic direction"],
    [snapshot.directionality.footnoteDefinition, "footnote definition uses automatic direction"],
    [snapshot.directionality.explicit, "explicit direction is preserved"],
    [!snapshot.directionality.inlineCodeHasDirection, "inline code has no direction attribute"],
    [!snapshot.directionality.fencedCodeHasDirection, "fenced code has no direction attribute"],
    [snapshot.footnotes.reference, "footnote reference is rendered"],
    [snapshot.footnotes.section, "footnote section is rendered"],
    [snapshot.footnotes.backreference, "footnote backreference is rendered"]
  ].find(([value]) => !value);
  if (missing) throw new GfmSemanticAssertionError(String(missing[1]));

  const filteredTag = Object.entries(snapshot.tagfilter.filteredTags).find(
    ([, filtered]) => !filtered
  );
  if (filteredTag) {
    throw new GfmSemanticAssertionError(
      `filtered ${filteredTag[0]} tag reached the final preview DOM as raw HTML`
    );
  }
}

class GfmSemanticAssertionError extends Error {
  constructor(message: string) {
    super(`GFM semantic assertion failed: ${message}`);
    this.name = "GfmSemanticAssertionError";
  }
}

type MermaidPalette = {
  background: string;
  nodeFill: string;
  textColor: string;
};

type ThemeExpectation = {
  mode: "auto" | "dark" | "light" | "vscode";
  light: string;
  dark: string;
  body?: "vscode-dark" | "vscode-light" | "vscode-high-contrast" | "vscode-high-contrast-light";
};

async function assertThemeRendering(page: Page): Promise<void> {
  await selectQuickPick(page, "GitHub Markdown: Change Light Theme", "Light");
  await selectQuickPick(page, "GitHub Markdown: Change Dark Theme", "Dark");
  await selectQuickPick(page, "GitHub Markdown: Change Theme Mode", "Single theme");
  await selectQuickPick(page, "Preferences: Color Theme", "Light Modern");
  await refreshPreview(page);
  const copyButtonAvailable = await hasCodeCopyButton(page);
  if (!copyButtonAvailable) {
    console.warn(
      "[host-preview] built-in code copy button is unavailable; skipping its rendering assertions"
    );
  }

  const singleCases = [
    ["Light", { mode: "light", light: "light", dark: "dark" }],
    ["Light Protanopia & Deuteranopia", { mode: "light", light: "light_colorblind", dark: "dark" }],
    ["Light high contrast", { mode: "light", light: "light_high_contrast", dark: "dark" }],
    ["Light Tritanopia", { mode: "light", light: "light_tritanopia", dark: "dark" }],
    ["Dark", { mode: "dark", light: "light", dark: "dark" }],
    ["Dark Protanopia & Deuteranopia", { mode: "dark", light: "light", dark: "dark_colorblind" }],
    ["Dark dimmed", { mode: "dark", light: "light", dark: "dark_dimmed" }],
    ["Dark high contrast", { mode: "dark", light: "light", dark: "dark_high_contrast" }],
    ["Dark Tritanopia", { mode: "dark", light: "light", dark: "dark_tritanopia" }]
  ] as const;

  let lightPalette: MermaidPalette | undefined;
  let darkPalette: MermaidPalette | undefined;
  let previousMode: ThemeExpectation["mode"] | undefined;
  let previousPalette: MermaidPalette | undefined;
  for (const [label, expectation] of singleCases) {
    await selectQuickPick(page, "GitHub Markdown: Change Single Theme", label);
    const palette = await waitForThemedPreview(
      page,
      expectation,
      previousMode && previousMode !== expectation.mode ? previousPalette : undefined
    );
    if (label === "Light") lightPalette = palette;
    if (label === "Dark dimmed") darkPalette = palette;
    if (copyButtonAvailable) await assertCodeCopyButtonTheme(page, label);
    previousMode = expectation.mode;
    previousPalette = palette;
  }
  assert(lightPalette && darkPalette, "Single mode captures light and dark Mermaid palettes");
  assert(
    !sameMermaidPalette(lightPalette, darkPalette),
    "Single mode switches Mermaid between light and dark palettes"
  );

  await selectQuickPick(page, "GitHub Markdown: Change Light Theme", "Light high contrast");
  await selectQuickPick(page, "GitHub Markdown: Change Dark Theme", "Dark Tritanopia");
  await selectQuickPick(page, "GitHub Markdown: Change Theme Mode", "Sync with system");

  await selectColorTheme(
    page,
    "Light Modern",
    {
      mode: "auto",
      light: "light_high_contrast",
      dark: "dark_tritanopia",
      body: "vscode-light"
    },
    lightPalette
  );
  await selectColorTheme(
    page,
    "Dark Modern",
    {
      mode: "auto",
      light: "light_high_contrast",
      dark: "dark_tritanopia",
      body: "vscode-dark"
    },
    darkPalette
  );

  await selectColorTheme(page, "Default High Contrast", {
    mode: "auto",
    light: "light_high_contrast",
    dark: "dark_tritanopia",
    body: "vscode-high-contrast"
  });

  await selectQuickPick(page, "GitHub Markdown: Change Theme Mode", "VS Code theme");
  await refreshPreview(page);
  await waitForThemedPreview(page, {
    mode: "vscode",
    light: "light_high_contrast",
    dark: "dark_tritanopia",
    body: "vscode-high-contrast"
  });
  if (copyButtonAvailable) await assertCodeCopyButtonTheme(page, "VS Code theme");
}

async function hasCodeCopyButton(page: Page, timeoutMs = 2_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        if (!(await frame.locator(".vscode-github-markdown").count())) continue;
        if (await frame.locator(".code-block-copy-button").count()) return true;
      } catch {
        // Preview frames can be replaced while detecting host capabilities.
      }
    }
    await page.waitForTimeout(100);
  }
  return false;
}

async function assertCodeCopyButtonTheme(page: Page, theme: string): Promise<void> {
  const state = await readCodeCopyButtonState(page);
  assert(
    state.buttonColor === state.expectedMuted && state.svgBackground === state.expectedMuted,
    `code copy icon uses the muted default color in ${theme}; observed ${JSON.stringify(state)}`
  );
  assert(
    state.buttonBackground === "rgba(0, 0, 0, 0)" && state.buttonBorderWidth === "0px",
    `code copy icon has no resting button chrome; observed ${JSON.stringify(state)}`
  );
  assert(
    state.buttonWidth === "28px" &&
      state.buttonHeight === "28px" &&
      state.buttonBorderRadius === "6px" &&
      state.buttonOpacity === "1",
    `code copy icon matches GitHub's visible 28px control; observed ${JSON.stringify(state)}`
  );
  assert(
    state.svgMaskImage !== "none" && state.pathDisplay === "none",
    `code copy icon uses the GitHub Octicon mask; observed ${JSON.stringify(state)}`
  );
  assert(
    state.parentTag === "PRE" &&
      state.buttonPosition === "absolute" &&
      state.buttonTop === "8px" &&
      state.buttonRight === "8px",
    `code copy icon sits directly in the code block; observed ${JSON.stringify(state)}`
  );
  assert(
    state.copiedMaskImage !== state.svgMaskImage && state.copiedColor === state.expectedSuccess,
    `copied feedback uses the GitHub check icon; observed ${JSON.stringify(state)}`
  );
  assert(
    state.centerOffset.x === 0 && state.centerOffset.y === 0,
    `code copy icon stays centered; observed ${JSON.stringify(state)}`
  );
}

async function readCodeCopyButtonState(page: Page) {
  for (const frame of page.frames()) {
    if (!(await frame.locator(".vscode-github-markdown").count())) continue;
    const button = frame.locator(".code-block-copy-button").first();
    await button.waitFor({ state: "attached", timeout: 2_000 });
    return button.evaluate((element) => {
      const svg = element.querySelector("svg");
      const path = svg?.querySelector("path");
      const root = element.closest<HTMLElement>(".vscode-github-markdown");
      if (!svg || !path || !root) throw new Error("Incomplete code copy button DOM");

      const resolveColor = (token: string): string => {
        const probe = document.createElement("span");
        probe.style.color = `var(${token})`;
        root.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const buttonRect = element.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const buttonStyle = getComputedStyle(element);
      const svgStyle = getComputedStyle(svg);
      const svgMaskImage = svgStyle.maskImage || svgStyle.webkitMaskImage;
      const expectedSuccess = resolveColor("--fgColor-success");
      element.classList.add("copied");
      const copiedStyle = getComputedStyle(element);
      const copiedSvgStyle = getComputedStyle(svg);
      const copiedColor = copiedStyle.color;
      const copiedMaskImage = copiedSvgStyle.maskImage || copiedSvgStyle.webkitMaskImage;
      element.classList.remove("copied");
      return {
        parentTag: element.parentElement?.tagName,
        buttonPosition: buttonStyle.position,
        buttonTop: buttonStyle.top,
        buttonRight: buttonStyle.right,
        buttonColor: buttonStyle.color,
        buttonBackground: buttonStyle.backgroundColor,
        buttonBorderWidth: buttonStyle.borderTopWidth,
        buttonBorderRadius: buttonStyle.borderRadius,
        buttonWidth: buttonStyle.width,
        buttonHeight: buttonStyle.height,
        buttonOpacity: buttonStyle.opacity,
        svgBackground: svgStyle.backgroundColor,
        svgMaskImage,
        copiedColor,
        copiedMaskImage,
        pathDisplay: getComputedStyle(path).display,
        expectedMuted: resolveColor("--fgColor-muted"),
        expectedSuccess,
        centerOffset: {
          x: svgRect.x + svgRect.width / 2 - (buttonRect.x + buttonRect.width / 2),
          y: svgRect.y + svgRect.height / 2 - (buttonRect.y + buttonRect.height / 2)
        }
      };
    });
  }
  throw new Error("Code copy button preview frame not found");
}

async function selectColorTheme(
  page: Page,
  option: string,
  expectation: ThemeExpectation,
  expectedPalette?: MermaidPalette
): Promise<MermaidPalette> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxThemeAttempts; attempt += 1) {
    try {
      await selectQuickPick(page, "Preferences: Color Theme", option);
      await refreshPreview(page);
      return await waitForThemedPreview(
        page,
        expectation,
        undefined,
        themeSettleAttemptTimeoutMs,
        expectedPalette
      );
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[host-preview] color theme attempt ${attempt}/${maxThemeAttempts} failed for "${option}": ${message}`
      );
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Failed to apply VS Code color theme "${option}" after ${maxThemeAttempts} attempts: ${message}`
  );
}

async function refreshPreview(page: Page): Promise<void> {
  for (const frame of page.frames()) {
    try {
      await frame
        .locator(".mermaid svg")
        .evaluateAll((svgs) =>
          svgs.forEach((svg) => svg.setAttribute("data-host-preview-stale", ""))
        );
    } catch {
      // Preview frames can be replaced while marking the current render.
    }
  }

  await runCommand(page, "Markdown: Refresh Preview");
  await page
    .locator(".quick-input-widget")
    .waitFor({ state: "hidden", timeout: quickInputTimeoutMs });

  const deadline = Date.now() + themeSettleAttemptTimeoutMs;
  while (Date.now() < deadline) {
    let rendered = false;
    let stale = false;
    for (const frame of page.frames()) {
      try {
        rendered ||= (await frame.locator(".mermaid svg").count()) > 0;
        stale ||= (await frame.locator(".mermaid svg[data-host-preview-stale]").count()) > 0;
      } catch {
        // Preview frames can be replaced while the refresh completes.
      }
    }
    if (rendered && !stale) return;
    await page.waitForTimeout(100);
  }

  throw new Error(
    "Host preview test failed: Mermaid did not rerender after refreshing the preview"
  );
}

async function openFile(page: Page, fileName: string): Promise<void> {
  const file = page.locator(".explorer-viewlet .monaco-list-row").filter({ hasText: fileName });
  await file.first().waitFor({ state: "visible" });
  await file.first().click();
  await page
    .locator(".tabs-container .tab")
    .filter({ hasText: fileName })
    .first()
    .waitFor({ state: "visible" });
}

async function runCommand(page: Page, command: string): Promise<void> {
  const quickInput = page.locator(".quick-input-widget");
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxCommandAttempts; attempt += 1) {
    try {
      await closeQuickInput(page, quickInput);
      await page.locator(".monaco-workbench").press("F1");

      const visibleQuickInput = page.locator(".quick-input-widget:visible");
      const input = visibleQuickInput.locator("input");
      await input.waitFor({ state: "visible", timeout: quickInputTimeoutMs });
      await input.fill(`>${command}`, { timeout: quickInputTimeoutMs });

      const result = visibleQuickInput.locator(".monaco-list-row").filter({ hasText: command });
      await result.first().waitFor({ state: "visible", timeout: quickInputTimeoutMs });
      await result.first().click({ timeout: quickInputTimeoutMs });
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[host-preview] command palette attempt ${attempt}/${maxCommandAttempts} failed for "${command}": ${message}`
      );
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Failed to run VS Code command "${command}" after ${maxCommandAttempts} attempts: ${message}`
  );
}

async function selectQuickPick(page: Page, command: string, option: string): Promise<void> {
  await runCommand(page, command);
  const quickInput = page.locator(".quick-input-widget:visible");
  const input = quickInput.locator("input");
  await input.waitFor({ state: "visible", timeout: quickInputTimeoutMs });
  await input.fill(option, { timeout: quickInputTimeoutMs });
  const result = quickInput.locator(".monaco-list-row").getByText(option, { exact: true });
  await result.first().waitFor({ state: "visible", timeout: quickInputTimeoutMs });
  await result.first().click({ timeout: quickInputTimeoutMs });
  await page
    .locator(".quick-input-widget")
    .waitFor({ state: "hidden", timeout: quickInputTimeoutMs });
}

async function closeQuickInput(page: Page, quickInput: Locator): Promise<void> {
  if (await quickInput.isVisible()) {
    await page.keyboard.press("Escape");
  }
  await quickInput.waitFor({ state: "hidden", timeout: quickInputTimeoutMs });
}

async function waitForThemedPreview(
  page: Page,
  expectation: ThemeExpectation,
  previousPalette?: MermaidPalette,
  timeoutMs = 30_000,
  expectedPalette?: MermaidPalette
): Promise<MermaidPalette> {
  const deadline = Date.now() + timeoutMs;
  const selector =
    `.vscode-github-markdown[data-color-mode="${expectation.mode}"]` +
    `[data-light-theme="${expectation.light}"]` +
    `[data-dark-theme="${expectation.dark}"]`;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        if (!(await frame.locator(selector).count())) continue;
        if (expectation.body && !(await frame.locator(`body.${expectation.body}`).count()))
          continue;
        if (!(await frame.locator(".mermaid svg").count())) continue;

        const palette = await readMermaidPalette(frame);
        if (previousPalette && sameMermaidPalette(palette, previousPalette)) continue;
        if (expectedPalette && !sameMermaidPalette(palette, expectedPalette)) continue;
        return palette;
      } catch {
        // Theme and client renderer changes can replace the preview frame.
      }
    }
    await page.waitForTimeout(100);
  }

  const observed = await observedThemeStates(page);
  throw new Error(
    `Host preview test failed: theme did not settle for ${selector}; observed ${JSON.stringify(observed)}`
  );
}

async function observedThemeStates(page: Page): Promise<unknown[]> {
  const states: unknown[] = [];
  for (const frame of page.frames()) {
    try {
      const palettes = await frame.locator(".mermaid svg").evaluateAll((svgs) =>
        svgs.map((svg) => {
          const node = svg.querySelector<SVGElement>(".node rect, .node polygon, .node path");
          const label = svg.querySelector<HTMLElement>(".nodeLabel");
          return {
            background: getComputedStyle(svg).backgroundColor,
            nodeFill: node ? getComputedStyle(node).fill : "",
            textColor: label ? getComputedStyle(label).color : ""
          };
        })
      );
      const themeStates = await frame.locator(".vscode-github-markdown").evaluateAll((elements) =>
        elements.map((element) => ({
          bodyClass: element.ownerDocument.body.className,
          colorMode: element.getAttribute("data-color-mode"),
          lightTheme: element.getAttribute("data-light-theme"),
          darkTheme: element.getAttribute("data-dark-theme")
        }))
      );
      states.push(...themeStates.map((state) => ({ ...state, palettes })));
    } catch {
      // Preview frames can be replaced while collecting failure diagnostics.
    }
  }
  return states;
}

async function readMermaidPalette(preview: Frame): Promise<MermaidPalette> {
  return preview.locator(".mermaid svg").evaluate((svg) => {
    const node = svg.querySelector<SVGElement>(".node rect, .node polygon, .node path");
    const label = svg.querySelector<HTMLElement>(".nodeLabel");
    return {
      background: getComputedStyle(svg).backgroundColor,
      nodeFill: node ? getComputedStyle(node).fill : "",
      textColor: label ? getComputedStyle(label).color : ""
    };
  });
}

function sameMermaidPalette(left: MermaidPalette, right: MermaidPalette): boolean {
  return (
    left.background === right.background &&
    left.nodeFill === right.nodeFill &&
    left.textColor === right.textColor
  );
}

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Host preview test failed: ${message}`);
  }
}
