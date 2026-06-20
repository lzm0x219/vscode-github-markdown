import { rm } from "node:fs/promises";
import { writeGithubCssFiles } from "./css/github-css";
import { buildPreviewCss } from "./css/preview-css";
import { paths } from "./shared/paths";
import { runLocalExecutable } from "./shared/run";

await rm(paths.dist, { recursive: true, force: true });

console.log("building extension...");
await Promise.all([runLocalExecutable("tsdown"), buildCss()]);

console.log("build complete");

async function buildCss(): Promise<void> {
  await writeGithubCssFiles();
  await buildPreviewCss();
}
