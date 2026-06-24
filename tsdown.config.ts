import { defineConfig } from "tsdown";
import isInCi from "is-in-ci";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig([
  {
    entry: {
      extension: "src/extension.ts"
    },
    format: ["cjs"],
    outExtensions: () => ({
      js: ".js"
    }),
    platform: "node",
    dts: false,
    clean: false,
    publint: true,
    deps: {
      neverBundle: ["vscode", "markdown-it"]
    },
    plugins: [
      visualizer({
        open: !isInCi,
        filename: ".cache/stats.html",
        gzipSize: true,
        brotliSize: true
      })
    ]
  },
  {
    entry: {
      "extension.preview": "src/extension.preview.ts"
    },
    format: ["iife"],
    platform: "browser",
    dts: false,
    clean: false,
    publint: true,
    globalName: "GitHubMarkdownPreview",
    outputOptions: {
      entryFileNames: "[name].js"
    }
  }
]);
