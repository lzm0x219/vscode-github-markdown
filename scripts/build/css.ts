import { join, relative } from "node:path";
import { writeTextIfChanged } from "../shared/files";
import { project } from "../shared/project";
import { createGithubCssAssets } from "./github-css";
import { buildPreviewCss, type CssBuildResult } from "./preview-css";

export async function buildCss(): Promise<CssBuildResult> {
  const assets = await createGithubCssAssets();
  await Promise.all(
    assets.map(({ fileName, content }) =>
      writeTextIfChanged(join(project.paths.dist, fileName), content)
    )
  );
  return buildPreviewCss();
}

export function formatCssBuild(result: CssBuildResult): string {
  return `[css] ${relativePath(result.path)} ${formatKilobytes(result.bytes)} | gzip ${formatKilobytes(result.gzipBytes)}`;
}

function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

function relativePath(path: string): string {
  const fromRoot = relative(project.root, path);
  return fromRoot.startsWith("..") ? path : fromRoot;
}
