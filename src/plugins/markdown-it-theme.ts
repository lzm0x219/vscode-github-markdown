export default function markdownItTheme(md: markdownit) {
	const render = md.renderer.render;
	const theme = "github-light-default";

	md.renderer.render = function (...args) {
		return `
      <div class="vscode-markdown-github ${theme}">
        ${render.apply(md.renderer, args)}
      </div>
    `;
	};
	return md;
}
