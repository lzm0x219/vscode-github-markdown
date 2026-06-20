import { spawn } from "bun";
import { watch, type FSWatcher } from "node:fs";
import { writeGithubCssFiles } from "./css/github-css";
import { buildPreviewCss } from "./css/preview-css";
import { paths, localExecutable } from "./shared/paths";

try {
  await writeGithubCssFiles();
  await buildPreviewCss();
} catch (error) {
  console.error("[css] initial build failed:", error);
  console.log("[css] watch stays active; save the CSS file to retry");
}

const cssWatcher = watchCss();
const tsdownProc = spawn({
  cmd: [localExecutable("tsdown"), "--watch"],
  stdout: "inherit",
  stderr: "inherit"
});

let cleanedUp = false;

async function cleanup(killTsdown = true): Promise<void> {
  if (cleanedUp) return;
  cleanedUp = true;
  cssWatcher.close();
  if (killTsdown) tsdownProc.kill("SIGINT");
}

process.once("SIGINT", () => {
  void exit(130);
});

process.once("SIGTERM", () => {
  void exit(143);
});

const exitCode = await tsdownProc.exited;
await cleanup(false);
process.exit(exitCode);

async function exit(code: number): Promise<never> {
  await cleanup();
  process.exit(code);
}

function watchCss(): FSWatcher {
  let cssBuild = Promise.resolve();

  async function runCssBuild(): Promise<void> {
    try {
      await buildPreviewCss();
    } catch (error) {
      console.error("[css] rebuild failed:", error);
    }
  }

  function queueCssBuild(): void {
    cssBuild = cssBuild.then(runCssBuild);
  }

  return watch(paths.previewCssSource, queueCssBuild);
}
