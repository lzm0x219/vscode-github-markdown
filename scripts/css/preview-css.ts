import { bundleAsync } from "lightningcss";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { paths } from "../shared/paths";
import { formatKilobytes } from "../shared/run";
import { githubCssImportBlock } from "./github-css";

const require = createRequire(import.meta.url);
const decoder = new TextDecoder();

export async function buildPreviewCss(): Promise<void> {
  await mkdir(paths.dist, { recursive: true });

  const result = await bundleAsync({
    filename: paths.previewCssSource,
    minify: true,
    drafts: {
      customMedia: true
    },
    resolver: {
      read: (file) => readFile(file, "utf8"),
      resolve: resolveCssImport
    }
  });

  for (const warning of result.warnings) {
    console.warn(`[css] ${warning.message}`);
  }

  await writeFile(
    paths.previewCssOutput,
    `${githubCssImportBlock()}\n${decoder.decode(result.code)}`
  );
  await logCssSize(paths.previewCssOutput);
}

function resolveCssImport(specifier: string, fromFile: string): string {
  if (specifier.startsWith(".") || isAbsolute(specifier)) {
    return resolve(dirname(fromFile), specifier);
  }

  return require.resolve(specifier, {
    paths: [dirname(fromFile)]
  });
}

async function logCssSize(file: string): Promise<void> {
  const bytes = await readFile(file);
  const gzippedBytes = gzipSync(bytes).byteLength;
  console.log(
    `[css] ${file} ${formatKilobytes(bytes.byteLength)} | gzip ${formatKilobytes(gzippedBytes)}`
  );
}
