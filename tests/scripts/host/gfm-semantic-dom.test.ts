import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assertGfmSemanticRendering } from "../../../scripts/host/preview";
import { renderLocalMarkdown } from "../../../scripts/parity/local";
import { project } from "../../../scripts/shared/project";

vi.mock("vscode", () => ({ l10n: { t: (message: string) => message } }));

const browsers: Array<Awaited<ReturnType<typeof chromium.launch>>> = [];

afterEach(async () => {
  await Promise.all(browsers.splice(0).map((browser) => browser.close()));
});

describe("GFM semantic final DOM contract", () => {
  it("passes for the checked-in host fixture through a real browser DOM", async () => {
    const markdown = readFileSync(
      join(project.root, "tests/fixtures/host/gfm-semantics.md"),
      "utf8"
    );
    const browser = await chromium.launch({ headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const referenceCss = readFileSync(project.paths.parityReferenceCss, "utf8");
    await page.setContent(
      `<style>${referenceCss}</style><main class="vscode-github-markdown">${renderLocalMarkdown(markdown)}</main>`
    );

    await expect(assertGfmSemanticRendering(page, 1_000)).resolves.toBeUndefined();
  });

  it("waits for the preview stylesheet before checking the horizontal rule", async () => {
    const markdown = readFileSync(
      join(project.root, "tests/fixtures/host/gfm-semantics.md"),
      "utf8"
    );
    const browser = await chromium.launch({ headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    await page.setContent(
      `<main class="vscode-github-markdown">${renderLocalMarkdown(markdown)}</main>`
    );
    const referenceCss = readFileSync(project.paths.parityReferenceCss, "utf8");
    await page.evaluate((css) => {
      setTimeout(() => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.append(style);
      }, 200);
    }, referenceCss);

    await expect(assertGfmSemanticRendering(page, 3_000)).resolves.toBeUndefined();
  });

  it("reports a horizontal rule that remains too thick", async () => {
    const markdown = readFileSync(
      join(project.root, "tests/fixtures/host/gfm-semantics.md"),
      "utf8"
    );
    const browser = await chromium.launch({ headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const referenceCss = readFileSync(project.paths.parityReferenceCss, "utf8");
    await page.setContent(
      `<style>${referenceCss}\n.vscode-github-markdown hr { height: 4px; }</style><main class="vscode-github-markdown">${renderLocalMarkdown(markdown)}</main>`
    );

    await expect(assertGfmSemanticRendering(page, 500)).rejects.toThrow("observed 4px");
  });
});
