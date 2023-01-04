import vscode from "vscode";

export default function markdownItImage(context: vscode.ExtensionContext) {
	return (md: markdownit) => {
		const render = md.renderer.rules.html_block;
		md.renderer.rules.html_block = function (tokens, idx, options, env, self) {
			const token = tokens[idx];
			const isImage = /<img.*?(?:>|\/>)/gi.test(token.content);
			if (isImage) {
				token.content = token.content.replace(
					/(<img.+?src=")(.+?)"/g,
					(match, $tag, $src) => {
						const isNeedHandel = /^\//.test($src);
						if (isNeedHandel) {
							// 'asWebviewUri' should be used here. [https://github.com/microsoft/vscode/blob/1fb94816f2d40bdc77536eac44eada91a9a9e8ac/src/vs/workbench/common/webview.ts]
							const source = `https://file+.vscode-resource.vscode-cdn.net${context.asAbsolutePath(
								$src,
							)}`;
							return `${$tag}${source}"`;
						}
						return match;
					},
				);
			}
			return render(tokens, idx, options, env, self);
		};
		return md;
	};
}
