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
    await page.setContent(
      `<main class="vscode-github-markdown">${renderLocalMarkdown(markdown)}</main>`
    );

    await expect(assertGfmSemanticRendering(page, 1_000)).resolves.toBeUndefined();
  });
});
