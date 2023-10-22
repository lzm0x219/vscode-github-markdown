import configuration from "../configuration";

export default function markdownItGitHubTheme(md: markdownit) {
  const render = md.renderer.render;

  md.renderer.render = function (...args) {
    return `
      <div
        class="vscode-github-markdown"
        data-theme-mode="${configuration.getThemeMode()}"
        data-theme-single="${configuration.getThemeSingle()}"
        data-theme-system-day="${configuration.getThemeSystemDay()}"
        data-theme-system-night="${configuration.getThemeSystemNight()}
      >
        ${render.apply(md.renderer, args)}
      </div>
    `;
  };
  return md;
}
