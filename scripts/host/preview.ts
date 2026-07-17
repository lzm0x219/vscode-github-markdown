import type { Frame, Page } from "playwright";

const primaryModifier = process.platform === "darwin" ? "Meta" : "Control";

export async function assertClientRenderedPreview(page: Page): Promise<void> {
  await page.locator(".monaco-workbench").waitFor({ state: "visible", timeout: 30_000 });

  await openFile(page, "client-rendering.md");
  await runCommand(page, "Markdown: Open Preview to the Side");

  const preview = await waitForClientRenderedPreview(page);
  await assertFinalClientRendering(preview);
  await assertThemeRendering(page);
}

type MermaidPalette = {
  background: string;
  nodeFill: string;
  textColor: string;
};

type ThemeExpectation = {
  mode: "auto" | "dark" | "light";
  light: string;
  dark: string;
  body?: "vscode-dark" | "vscode-light";
};

async function assertThemeRendering(page: Page): Promise<void> {
  await selectQuickPick(page, "GitHub Markdown: Change Light Theme", "Light");
  await selectQuickPick(page, "GitHub Markdown: Change Dark Theme", "Dark");
  await selectQuickPick(page, "GitHub Markdown: Change Theme Mode", "Single theme");

  const singleCases = [
    ["Light", { mode: "light", light: "light", dark: "dark" }],
    ["Dark dimmed", { mode: "dark", light: "light", dark: "dark_dimmed" }],
    ["Light Protanopia & Deuteranopia", { mode: "light", light: "light_colorblind", dark: "dark" }],
    ["Light high contrast", { mode: "light", light: "light_high_contrast", dark: "dark" }],
    ["Light Tritanopia", { mode: "light", light: "light_tritanopia", dark: "dark" }]
  ] as const;

  let lightPalette: MermaidPalette | undefined;
  let darkPalette: MermaidPalette | undefined;
  for (const [label, expectation] of singleCases) {
    await selectQuickPick(page, "GitHub Markdown: Change Single Theme", label);
    const palette = await waitForThemedPreview(page, expectation);
    if (label === "Light") lightPalette = palette;
    if (label === "Dark dimmed") darkPalette = palette;
  }
  assert(
    JSON.stringify(lightPalette) !== JSON.stringify(darkPalette),
    "Single mode switches Mermaid between light and dark palettes"
  );

  await selectQuickPick(page, "GitHub Markdown: Change Light Theme", "Light high contrast");
  await selectQuickPick(page, "GitHub Markdown: Change Dark Theme", "Dark Tritanopia");
  await selectQuickPick(page, "GitHub Markdown: Change Theme Mode", "Sync with system");

  await selectQuickPick(page, "Preferences: Color Theme", "Light Modern");
  const systemLightPalette = await waitForThemedPreview(page, {
    mode: "auto",
    light: "light_high_contrast",
    dark: "dark_tritanopia",
    body: "vscode-light"
  });
  await selectQuickPick(page, "Preferences: Color Theme", "Dark Modern");
  await waitForThemedPreview(
    page,
    {
      mode: "auto",
      light: "light_high_contrast",
      dark: "dark_tritanopia",
      body: "vscode-dark"
    },
    systemLightPalette
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
  await page.keyboard.press(`${primaryModifier}+Shift+P`);
  const input = page.locator(".quick-input-widget input:visible");
  await input.waitFor({ state: "visible" });
  await input.fill(`>${command}`);
  const result = page
    .locator(".quick-input-widget:visible .monaco-list-row")
    .filter({ hasText: command });
  await result.first().waitFor({ state: "visible" });
  await result.first().click();
}

async function selectQuickPick(page: Page, command: string, option: string): Promise<void> {
  await runCommand(page, command);
  const result = page
    .locator(".quick-input-widget:visible .monaco-list-row")
    .getByText(option, { exact: true });
  await result.first().waitFor({ state: "visible" });
  await result.first().click();
}

async function waitForClientRenderedPreview(page: Page): Promise<Frame> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const rendered = await Promise.all([
          frame.locator(".vscode-github-markdown").count(),
          frame.locator(".mermaid svg").count(),
          frame.locator(".katex-display .katex").count()
        ]);
        if (rendered.every((count) => count > 0)) {
          return frame;
        }
      } catch {
        // Client renderers can reload the preview frame while they initialize.
      }
    }
    await page.waitForTimeout(100);
  }

  throw new Error(
    `Host preview test failed: preview frame was not found. Frames: ${page
      .frames()
      .map((frame) => frame.url())
      .join(", ")}`
  );
}

async function assertFinalClientRendering(preview: Frame): Promise<void> {
  const mermaid = preview.locator(".mermaid svg");
  assert((await mermaid.textContent())?.includes("Alpha"), "Mermaid renders Alpha in an SVG");
  assert((await mermaid.textContent())?.includes("Beta"), "Mermaid renders Beta in an SVG");

  const katexHtml = preview.locator(".katex-display .katex-html");
  assert(await katexHtml.isVisible(), "KaTeX output is visible");
  const katexBox = await katexHtml.boundingBox();
  assert(
    katexBox && katexBox.width > 0 && katexBox.height > 0,
    "KaTeX output occupies visible space"
  );
  const katexSource = await preview
    .locator('.katex-display annotation[encoding="application/x-tex"]')
    .textContent();
  assert(katexSource?.includes("S_{12}"), "KaTeX preserves the complete fixture expression");

  const overflow = await preview.evaluate(() => {
    const pageScroller = document.scrollingElement;
    const nestedVerticalScrollers = [
      ...document.querySelectorAll<HTMLElement>("body, body *")
    ].filter((element) => {
      if (element === pageScroller) return false;
      const style = getComputedStyle(element);
      return (
        ["auto", "scroll"].includes(style.overflowY) &&
        element.scrollHeight > element.clientHeight + 1
      );
    });
    return {
      pageScrollable: Boolean(
        pageScroller && pageScroller.scrollHeight > pageScroller.clientHeight + 1
      ),
      nestedVerticalScrollerLabels: nestedVerticalScrollers.map((element) =>
        typeof element.className === "string" && element.className
          ? element.className
          : element.tagName
      )
    };
  });
  assert(overflow.pageScrollable, "Long KaTeX fixture exercises the page scrollbar");
  assert(
    overflow.nestedVerticalScrollerLabels.length === 0,
    `KaTeX does not create a second vertical scroll area (${overflow.nestedVerticalScrollerLabels.join(", ")})`
  );
}

async function waitForThemedPreview(
  page: Page,
  expectation: ThemeExpectation,
  previousPalette?: MermaidPalette
): Promise<MermaidPalette> {
  const deadline = Date.now() + 30_000;
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
        if (previousPalette && JSON.stringify(palette) === JSON.stringify(previousPalette))
          continue;
        return palette;
      } catch {
        // Theme and client renderer changes can replace the preview frame.
      }
    }
    await page.waitForTimeout(100);
  }

  throw new Error(`Host preview test failed: theme did not settle for ${selector}`);
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

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Host preview test failed: ${message}`);
  }
}
