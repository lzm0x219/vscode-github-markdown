import configuration from "../configuration";
import { ThemeColorMode, ThemeMode } from "../constants";

export default function markdownItGitHubTheme(md: markdownit) {
  const render = md.renderer.render;

  md.renderer.render = function (...args) {
    return `
      <div
        class="vscode-github-markdown"
        data-color-mode="${1}"
        data-light-theme="${configuration.getThemeSystemDay()}"
        data-dark-theme="${configuration.getThemeSystemNight()}"
      >
        ${render.apply(md.renderer, args)}
      </div>
    `;
  };
  return md;
}
