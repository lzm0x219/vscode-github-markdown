import { defineConfig } from "tsdown";
import isInCi from "is-in-ci";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
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
  },
  plugins: [
    visualizer({
      open:
        process.env["VISUALIZER_OPEN"] === undefined
          ? !isInCi
          : process.env["VISUALIZER_OPEN"] === "true",
      filename: ".cache/stats.html",
      gzipSize: true,
      brotliSize: true
    })
  ]
});
