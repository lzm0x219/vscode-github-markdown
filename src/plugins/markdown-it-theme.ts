import { getThemeMode } from "../configuration/themeMode";
import { getThemeLight } from "../configuration/themeLight";
import { getThemeDark } from "../configuration/themeDark";

export default function markdownItTheme(md: markdownit) {
	const render = md.renderer.render;

	md.renderer.render = function (...args) {
		return `
      <div class="vscode-markdown-github" data-color-mode="${getThemeMode()}" data-light-theme="${getThemeLight()}" data-dark-theme="${getThemeDark()}">
        ${render.apply(md.renderer, args)}
      </div>
    `;
	};
	return md;
}
