#!/usr/bin/env zx

import "zx/globals";
import esbuild, { type BuildOptions, BuildResult } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

process.env.FORCE_COLOR = "1";

void (async function () {
  await fs.remove("dist");
  await build();
})();

async function build() {
  try {
    await Promise.all([
      compileExtension("node", argv.watch),
      compileExtension("webworker", argv.watch),
      compileExtension("browser", argv.watch),
      compileStyles(argv.watch),
    ]);
  } catch (error) {
    echo(error);
    process.exit(1);
  }
}

type Target = "node" | "webworker" | "browser";

const targetOptions: Record<Target, BuildOptions> = {
  node: {
    entryPoints: ["src/extension.ts"],
    outfile: "dist/extension.js",
    platform: "node",
    target: ["es2022", "node18.15"],
    tsconfig: "tsconfig.json",
  },
  webworker: {
    entryPoints: ["src/extension.ts"],
    outfile: "dist/extension.browser.js",
    platform: "browser",
    target: ["es2022", "chrome114"],
    tsconfig: "tsconfig.webworker.json",
    plugins: [
      nodeModulesPolyfillPlugin({
        globals: {
          process: true,
        },
      }),
    ],
  },
  browser: {
    entryPoints: ["src/extension.preview.ts"],
    outfile: "dist/extension.preview.js",
    platform: "browser",
    target: ["es2022", "chrome114"],
    tsconfig: "tsconfig.browser.json",
  },
};

async function compileExtension(target: Target, watch: boolean) {
  const targetOption = targetOptions[target];

  const options: BuildOptions = {
    bundle: true,
    entryPoints: targetOption.entryPoints,
    alias: targetOption.alias,
    external: ["vscode"],
    format: "esm",
    keepNames: true,
    legalComments: "none",
    metafile: true,
    minify: !watch,
    outfile: targetOption.outfile,
    platform: targetOption.platform,
    sourcemap: watch,
    target: targetOption.target,
    treeShaking: true,
    tsconfig: targetOption.tsconfig,
    color: true,
    logLevel: "info",
    plugins: targetOption.plugins,
    packages: "external",
  };
  const result = watch
    ? await esbuildWatch(options)
    : await esbuild.build(options);
  await analyzeMetafile(result);
}

async function compileStyles(watch: boolean) {
  const options: BuildOptions = {
    bundle: true,
    entryPoints: ["src/extension.preview.scss"],
    plugins: [sassPlugin()],
    outdir: "dist",
    metafile: true,
    color: true,
    minify: !watch,
    logLevel: "info",
  };

  try {
    const result = watch
      ? await esbuildWatch(options)
      : await esbuild.build(options);
    await analyzeMetafile(result);
  } catch (error) {
    echo(error);
  }
}

async function esbuildWatch(options: BuildOptions) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  return ctx.rebuild();
}

async function analyzeMetafile(result: BuildResult) {
  if (result.metafile) {
    echo(
      await esbuild.analyzeMetafile(result.metafile, {
        verbose: true,
        color: true,
      }),
    );
  }
}
