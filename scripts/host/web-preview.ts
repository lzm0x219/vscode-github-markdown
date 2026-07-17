import { open } from "@vscode/test-web";
import { join } from "node:path";
import { chromium } from "playwright";
import { project } from "../shared/project";
import { assertClientRenderedPreview } from "./preview";
import { hostVersions } from "./versions";

const port = Number(process.env["VSCODE_TEST_WEB_PORT"] ?? "3000");
const endpoint = `http://localhost:${port}`;
const fixtures = join(project.root, "tests", "fixtures", "host");
const dataDir = join(project.root, ".cache", "vscode-test-web");

const server = await open({
  browserType: "none",
  extensionDevelopmentPath: project.root,
  folderPath: fixtures,
  headless: true,
  host: "localhost",
  port,
  quality: "stable",
  commit: hostVersions.stable.commit,
  testRunnerDataDir: dataDir
});
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(endpoint);
  await assertClientRenderedPreview(page);
} finally {
  await browser.close();
  server.dispose();
}
