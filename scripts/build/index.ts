import { rm } from "node:fs/promises";
import { runLocalBinary } from "../shared/process";
import { project } from "../shared/project";
import { buildCss, formatCssBuild } from "./css";

await rm(project.paths.dist, { recursive: true, force: true });
console.log("Building extension...");

const [, css] = await Promise.all([runLocalBinary("tsdown", ["--minify"]), buildCss()]);
console.log(formatCssBuild(css));
console.log("Build complete");
