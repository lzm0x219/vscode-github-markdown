#!/usr/bin/env node

import "zx/globals";
import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

void (async () => {
	const isWatchMode = Boolean(~~argv.w);

	const result = await esbuild.build({
		bundle: true,
		entryPoints: ["styles/main.scss"],
		plugins: [sassPlugin()],
		outfile: "dist/main.css",
		watch: isWatchMode,
		minify: !isWatchMode,
		metafile: true,
	});

	const metafileMessages = await esbuild.analyzeMetafile(result.metafile);

	echo(metafileMessages);

	if (isWatchMode) {
		echo("watching...");
	}
})();
