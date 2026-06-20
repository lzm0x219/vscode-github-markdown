import { join, resolve } from "node:path";

export const paths: {
  dist: string;
  previewCssSource: string;
  previewCssOutput: string;
} = {
  dist: "dist",
  previewCssSource: "src/extension.preview.css",
  previewCssOutput: join("dist", "extension.preview.css")
};

export function localExecutable(name: string): string {
  return resolve("node_modules", ".bin", process.platform === "win32" ? `${name}.cmd` : name);
}
