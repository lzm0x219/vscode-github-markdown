import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { createGithubCssAssets, githubCssFileNames, type GithubTheme } from "../build/github-css";
import { project } from "../shared/project";

export type ScreenshotRequest = {
  id: string;
  html: string;
  css: string;
  theme: "light" | "dark";
  themeName: GithubTheme;
  linkUnderlines: boolean;
};

const viewport = { width: 1024, height: 720 };
export const visualRenderConfiguration = JSON.stringify({
  viewport,
  deviceScaleFactor: 1,
  javaScriptEnabled: false,
  capture: "markdown-container"
});
const commonCss = `
  :root { --vscode-editor-font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  html, body { margin: 0; background: transparent; }
  .vscode-github-markdown {
    box-sizing: border-box;
    width: ${viewport.width}px;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 36px !important;
  }
`;
const githubPageCss = `
  .vscode-github-markdown a { text-decoration: underline; }
  .vscode-github-markdown[data-link-underlines="false"] a { text-decoration: none; }
  .vscode-github-markdown [data-footnote-ref],
  .vscode-github-markdown .data-footnote-backref { text-decoration: none; }
`;
const maxImageDimension = 4096;

export function deterministicImageFixture(url: string): string {
  const canonicalUrl = decodeCamoUrl(url) ?? url;
  const dimensions = canonicalUrl.match(/\/(\d+)x(\d+)(?:\/|$)/);
  const [width, height] = boundedDimensions(dimensions?.[1], dimensions?.[2]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#0366d6"/></svg>`;
}

function boundedDimensions(widthValue: string | undefined, heightValue: string | undefined) {
  const width = safeDimension(widthValue);
  const height = safeDimension(heightValue);
  const scale = Math.min(1, maxImageDimension / Math.max(width, height));
  return [
    String(Math.max(1, Math.round(width * scale))),
    String(Math.max(1, Math.round(height * scale)))
  ] as const;
}

function safeDimension(value: string | undefined): number {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : maxImageDimension;
}

function decodeCamoUrl(url: string): string | undefined {
  if (!url.startsWith("https://camo.githubusercontent.com/")) return undefined;
  const encoded = url.split("/").at(-1);
  if (!encoded || !/^(?:[\da-f]{2})+$/i.test(encoded)) return undefined;
  return Buffer.from(encoded, "hex").toString("utf8");
}

export async function captureScreenshots(
  requests: readonly ScreenshotRequest[]
): Promise<{ chromiumVersion: string; screenshots: Record<string, Buffer> }> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
      javaScriptEnabled: false
    });
    await page.route("**/*", (route) => {
      if (route.request().resourceType() === "image") {
        return route.fulfill({
          contentType: "image/svg+xml",
          body: deterministicImageFixture(route.request().url())
        });
      }
      return route.abort();
    });
    const screenshots: Record<string, Buffer> = {};
    for (const { id, html, css, theme, themeName, linkUnderlines } of requests) {
      await page.emulateMedia({ colorScheme: theme });
      const safeCss = `${css}\n${commonCss}`.replace(/<\/style/gi, "<\\/style");
      await page.setContent(
        `<style>${safeCss}</style><main class="vscode-github-markdown" data-color-mode="${theme}" data-light-theme="${theme === "light" ? themeName : "light"}" data-dark-theme="${theme === "dark" ? themeName : "dark"}" data-link-underlines="${linkUnderlines}">${html}</main>`
      );
      screenshots[id] = await page.locator(".vscode-github-markdown").screenshot({
        animations: "disabled"
      });
    }
    await page.close();
    return { chromiumVersion: browser.version(), screenshots };
  } finally {
    await browser.close();
  }
}

export async function createReferenceCss(): Promise<string> {
  return `${(await createGithubCssAssets()).map(({ content }) => content).join("\n")}\n${githubPageCss}`;
}

export async function readLocalCss(): Promise<string> {
  const cssFiles = await Promise.all(
    githubCssFileNames().map((fileName) => readFile(join(project.paths.dist, fileName), "utf8"))
  );
  const previewCss = (await readFile(project.paths.previewCssOutput, "utf8")).replace(
    /@import\s+"\.\/github-markdown[^;]+;"/g,
    ""
  );
  return [...cssFiles, previewCss].join("\n");
}
