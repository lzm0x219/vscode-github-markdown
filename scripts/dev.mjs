import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { mkdir, copyFile } from "node:fs/promises";

const sourceCss = new URL("../src/extension.preview.css", import.meta.url);
const distDir = new URL("../dist/", import.meta.url);
const targetCss = new URL("../dist/extension.preview.css", import.meta.url);

async function copyCss() {
  await mkdir(distDir, { recursive: true });
  await copyFile(sourceCss, targetCss);
}

await copyCss();

const tsdown = spawn(
  "pnpm",
  [
    "exec",
    "tsdown",
    "--watch",
    "src/extension.ts",
    "--watch",
    "src/extension.preview.ts",
    "--no-clean"
  ],
  {
    stdio: "inherit"
  }
);

const cssWatcher = watch(sourceCss, async () => {
  try {
    await copyCss();
  } catch (error) {
    console.error("[dev] failed to copy CSS:", error);
  }
});

const cleanup = () => {
  cssWatcher.close();
  tsdown.kill("SIGINT");
};

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

tsdown.on("exit", (code, signal) => {
  cssWatcher.close();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
