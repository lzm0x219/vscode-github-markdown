import type { Frame, Page } from "playwright";

export async function assertFinalClientRendering(page: Page, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const rendered = await Promise.all([
          frame.locator(".vscode-github-markdown").count(),
          frame.locator(".mermaid svg").count(),
          frame.locator(".katex-display .katex").count()
        ]);
        if (rendered.every((count) => count > 0)) {
          await assertClientRenderingInFrame(frame);
          return;
        }
      } catch (error) {
        lastError = error;
        // Keep frame discovery and assertions in one retry scope: client renderers can
        // reload the preview frame between either operation while they initialize.
      }
    }
    await page.waitForTimeout(100);
  }

  const lastErrorMessage =
    lastError instanceof Error ? lastError.message : JSON.stringify(lastError);
  const detail =
    lastError === undefined ? "" : ` Last renderer error: ${lastErrorMessage ?? "unknown"}.`;
  throw new Error(
    `Host preview test failed: final client-rendered preview was not found.${detail} Frames: ${page
      .frames()
      .map((frame) => frame.url())
      .join(", ")}`
  );
}

async function assertClientRenderingInFrame(preview: Frame): Promise<void> {
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

  for (const alt of ["Root Markdown image", "Relative Markdown image", "Root HTML image"]) {
    const image = preview.locator(`img[alt="${alt}"]`);
    if ((await image.count()) === 0 || typeof image.waitFor !== "function") continue;
    await image.waitFor({ state: "visible", timeout: 10_000 });
    const imageState = await image.evaluate((element) => {
      const image = element as HTMLImageElement;
      return { complete: image.complete, naturalWidth: image.naturalWidth };
    });
    assert(
      imageState.complete && imageState.naturalWidth > 0,
      `${alt} loads in the final Webview preview (${JSON.stringify(imageState)})`
    );
  }

  const source = preview.locator("source[srcset]");
  if ((await source.count()) > 0 && typeof source.getAttribute === "function") {
    const srcset = await source.first().getAttribute("srcset");
    assert(
      srcset !== null && !/^\s*\/images\/local-image\.svg(?:\s|,|$)/.test(srcset),
      `Project-root srcset candidates are rewritten in the final Webview preview (${srcset})`
    );
  }

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

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Host preview test failed: ${message}`);
  }
}
