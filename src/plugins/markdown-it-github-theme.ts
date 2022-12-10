export default function markdownItGithubTheme(md: markdownit) {
	const render = md.renderer.render;
	md.renderer.render = function (...args) {
		return `
      <div class="vscode-markdown-github">
        ${render.apply(md.renderer, args)}
      </div>
    `;
	};
	return md;
}
