import { bundleAsync } from "lightningcss";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { writeTextIfChanged } from "../shared/files";
import { project } from "../shared/project";
import { githubCssImports } from "./github-css";

export type CssBuildResult = {
  path: string;
  bytes: number;
  gzipBytes: number;
};

const require = createRequire(import.meta.url);

export async function buildPreviewCss(): Promise<CssBuildResult> {
  const result = await bundleAsync({
    filename: project.paths.previewCssSource,
    minify: true,
    drafts: { customMedia: true },
    resolver: {
      read: (path) => readFile(path, "utf8"),
      resolve: resolveCssImport
    }
  });
  for (const warning of result.warnings) console.warn(`[css] ${warning.message}`);

  const content = `${githubCssImports()}\n${new TextDecoder().decode(result.code)}`;
  await writeTextIfChanged(project.paths.previewCssOutput, content);
  return {
    path: project.paths.previewCssOutput,
    bytes: Buffer.byteLength(content),
    gzipBytes: gzipSync(content).byteLength
  };
}

function resolveCssImport(specifier: string, fromFile: string): string {
  if (specifier.startsWith(".") || isAbsolute(specifier)) {
    return resolve(dirname(fromFile), specifier);
  }
  return require.resolve(specifier, { paths: [dirname(fromFile)] });
}
