import configuration from "../configuration";
import { ThemeColorMode, ThemeMode } from "../constants";

export default function markdownItGitHubTheme(md: markdownit) {
  const render = md.renderer.render;

  const getColorMode = (): ThemeColorMode => {
    const mode = configuration.getThemeMode();
    const theme = configuration.getThemeSingle();
    if (mode === ThemeMode.Single) {
      if (theme.includes("light")) {
        return ThemeColorMode.Light;
      }
      return ThemeColorMode.Dark;
    }
    return ThemeColorMode.Auto;
  };

  md.renderer.render = function (...args) {
    return `
      <div
        class="vscode-github-markdown"
        data-color-mode="${getColorMode()}"
        data-light-theme="${configuration.getThemeSystemDay()}"
        data-dark-theme="${configuration.getThemeSystemNight()}"
      >
        ${render.apply(md.renderer, args)}
      </div>
    `;
  };
  return md;
}
