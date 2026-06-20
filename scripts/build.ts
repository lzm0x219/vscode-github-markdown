import { $ } from "bun";
import { rm } from "node:fs/promises";
import { buildCssAndLog, DIST } from "./_shared";

await rm(DIST, { recursive: true, force: true });

console.log("bundling TypeScript...");
await $`pnpm exec tsdown`;

await buildCssAndLog();

console.log("build complete");
