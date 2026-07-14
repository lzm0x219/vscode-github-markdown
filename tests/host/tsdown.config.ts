import { defineConfig } from "tsdown";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  entry: {
    smoke: `${root}/tests/host/smoke.ts`
  },
  format: ["cjs"],
  platform: "browser",
  target: "es2020",
  outDir: `${root}/.cache/host-tests`,
  clean: true,
  dts: false,
  deps: {
    neverBundle: ["vscode"]
  },
  outputOptions: {
    entryFileNames: "[name].js"
  }
});
