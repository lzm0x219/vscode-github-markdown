import { $ } from "bun";
import { mkdir } from "node:fs/promises";

export const DIST: string = "dist";
export const SRC_CSS: string = "src/extension.preview.css";
export const DIST_CSS: string = `${DIST}/extension.preview.css`;

export async function buildCss(): Promise<void> {
  await mkdir(DIST, { recursive: true });
  await $`pnpm exec lightningcss --minify -o ${DIST_CSS} ${SRC_CSS}`.quiet();
}

export async function buildCssAndLog(): Promise<void> {
  await buildCss();
  const bytes = await Bun.file(DIST_CSS).bytes();
  const gzipped = Bun.gzipSync(bytes).byteLength;
  console.log(`[css] ${DIST_CSS} ${fmtSize(bytes.byteLength)} | gzip ${fmtSize(gzipped)}`);
}

function fmtSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB`;
}
