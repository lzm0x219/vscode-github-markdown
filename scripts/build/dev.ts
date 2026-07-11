import { spawn, type ChildProcess } from "node:child_process";
import { watch, type FSWatcher } from "node:fs";
import { localBinary, waitForChild } from "../shared/process";
import { project } from "../shared/project";
import { buildCss, formatCssBuild } from "./css";
import { createCssBuildRunner } from "./css-runner";
import { shouldOpenVisualizer } from "./options";
import { buildPreviewCss } from "./preview-css";
import { createRebuildQueue } from "./rebuild-queue";

process.env["VISUALIZER_OPEN"] = String(shouldOpenVisualizer(process.argv.slice(2)));

const css = createCssBuildRunner({ buildAll: buildCss, buildPreview: buildPreviewCss });
try {
  console.log(formatCssBuild(await css.buildAll()));
} catch (error) {
  console.error("[css] Initial build failed; watching for the next change", error);
}

const queue = createRebuildQueue(
  async () => console.log(formatCssBuild(await css.rebuild())),
  (error) => console.error("[css] Rebuild failed", error)
);
const cssWatcher = watch(project.paths.previewCssSource, () => queue.request());
const tsdown = spawn(localBinary("tsdown"), ["--watch"], {
  cwd: project.root,
  stdio: "inherit"
});

const exitCode = await supervise(tsdown, cssWatcher);
process.exitCode = exitCode;

async function supervise(child: ChildProcess, watcher: FSWatcher): Promise<number> {
  let isClean = false;
  let isSettled = false;

  async function cleanup(terminateChild: boolean): Promise<void> {
    if (isClean) return;
    isClean = true;
    watcher.close();
    if (terminateChild && child.exitCode === null && child.signalCode === null)
      child.kill("SIGINT");
    await queue.idle();
  }

  return new Promise<number>((resolve, reject) => {
    const finish = async (code: number, terminateChild: boolean) => {
      if (isSettled) return;
      isSettled = true;
      process.off("SIGINT", onInterrupt);
      process.off("SIGTERM", onTerminate);
      await cleanup(terminateChild);
      resolve(code);
    };
    const fail = async (error: unknown) => {
      if (isSettled) return;
      isSettled = true;
      process.off("SIGINT", onInterrupt);
      process.off("SIGTERM", onTerminate);
      await cleanup(false);
      reject(error);
    };
    const onInterrupt = () => void finish(130, true);
    const onTerminate = () => void finish(143, true);
    process.once("SIGINT", onInterrupt);
    process.once("SIGTERM", onTerminate);

    waitForChild(child).then(
      (code) => void finish(code ?? 1, false),
      (error) => void fail(error)
    );
  });
}
