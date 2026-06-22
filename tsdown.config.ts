import { defineConfig } from "tsdown";

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
      neverBundle: ["vscode"]
    }
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
