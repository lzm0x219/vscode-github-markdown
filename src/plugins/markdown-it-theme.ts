import configuration from "../configuration";

export default function markdownItTheme(md: markdownit) {
  const render = md.renderer.render;

  md.renderer.render = function (...args) {
    return `
      <div class="vscode-github-markdown" data-color-mode="${configuration.getThemeMode()}" data-light-theme="${configuration.getThemeLight()}" data-dark-theme="${configuration.getThemeDark()}">
        ${render.apply(md.renderer, args)}
      </div>
    `;
  };
  return md;
}
