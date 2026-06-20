import { bundleAsync } from "lightningcss";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, resolve } from "node:path";

const require = createRequire(import.meta.url);

export const DIST: string = "dist";
export const SRC_CSS: string = "src/extension.preview.css";
export const DIST_CSS: string = `${DIST}/extension.preview.css`;

export async function buildCss(): Promise<void> {
  await mkdir(DIST, { recursive: true });
  const result = await bundleAsync({
    filename: SRC_CSS,
    minify: true,
    drafts: {
      customMedia: true
    },
    resolver: {
      read: (file) => readFile(file, "utf8"),
      resolve: (specifier, originatingFile) => {
        if (specifier.startsWith(".") || isAbsolute(specifier)) {
          return resolve(dirname(originatingFile), specifier);
        }

        return require.resolve(specifier, {
          paths: [dirname(originatingFile)]
        });
      }
    }
  });

  for (const warning of result.warnings) {
    console.warn(`[css] ${warning.message}`);
  }

  await writeFile(DIST_CSS, result.code);
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
