#!/usr/bin/env zx

import "zx/globals";
import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

void (async () => {
  const isWatchMode = Boolean(~~argv.w);
  const options = {
    bundle: true,
    entryPoints: ["styles/main.scss"],
    plugins: [sassPlugin()],
    outfile: "dist/main.css",
    metafile: true,
  };

  if (isWatchMode) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    echo("watching...");
  } else {
    const result = await esbuild.build({ ...options, minify: !isWatchMode });

    if (result.metafile) {
      const metafileMessages = await esbuild.analyzeMetafile(result.metafile);
      echo(metafileMessages);
    }
  }
})();
