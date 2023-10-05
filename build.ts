#!/usr/bin/env zx

import "zx/globals";
import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

void (async () => {
  if (argv.target === "style") {
    await buildStyles();
  }
})();

async function buildStyles() {
  try {
    const options: esbuild.BuildOptions = {
      bundle: true,
      entryPoints: ["src/extension.preview.scss"],
      plugins: [sassPlugin()],
      outfile: "dist/extension.preview.css",
      metafile: true,
      logLevel: "info",
      minify: argv.minify,
    };
    if (argv.watch) {
      const ctx = await esbuild.context(options);
      await ctx.watch();
      const result = await ctx.rebuild();
      if (result.metafile) {
        const metafileMessages = await esbuild.analyzeMetafile(result.metafile);
        echo(metafileMessages);
      }
    } else {
      await esbuild.build(options);
    }
  } catch (error) {
    echo(error);
  }
}
