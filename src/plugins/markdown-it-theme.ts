import { getTheme } from "../themes";

export default function markdownItTheme(md: markdownit) {
	const render = md.renderer.render;

	md.renderer.render = function (...args) {
		const theme = getTheme();
		return `
      <div class="vscode-markdown-github ${theme}">
        ${render.apply(md.renderer, args)}
      </div>
    `;
	};
	return md;
}
