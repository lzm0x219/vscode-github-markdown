import { spawn } from "bun";
import { watch } from "node:fs";
import { buildCssAndLog, SRC_CSS } from "./_shared";

try {
  await buildCssAndLog();
} catch (error) {
  console.error("[css] initial build failed:", error);
  console.log("[css] watch stays active; save the CSS file to retry");
}

const tsdownProc = spawn({
  cmd: ["pnpm", "exec", "tsdown", "--watch"],
  stdout: "inherit",
  stderr: "inherit"
});

let cssBuild = Promise.resolve();

function queueCssBuild(): void {
  cssBuild = cssBuild.then(buildCssAndLog).catch((error) => {
    console.error("[css] rebuild failed:", error);
  });
}

const cssWatcher = watch(SRC_CSS, queueCssBuild);

let cleanedUp = false;

function cleanup(killTsdown = true): void {
  if (cleanedUp) return;
  cleanedUp = true;
  cssWatcher.close();
  if (killTsdown) tsdownProc.kill("SIGINT");
}

process.once("SIGINT", () => {
  cleanup();
  process.exit(130);
});

process.once("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

const exitCode = await tsdownProc.exited;
cleanup(false);
process.exit(exitCode);
