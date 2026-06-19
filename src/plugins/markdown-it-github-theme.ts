import type MarkdownIt from "markdown-it";
import { getThemeColorMode, getThemeSystemDay, getThemeSystemNight } from "../theme";

export default function markdownItGitHubTheme(md: MarkdownIt): MarkdownIt {
  const render = md.renderer.render.bind(md.renderer);

  md.renderer.render = function (...args) {
    return `
      <div
        class="vscode-github-markdown"
        data-color-mode="${getThemeColorMode()}"
        data-light-theme="${getThemeSystemDay()}"
        data-dark-theme="${getThemeSystemNight()}"
      >
        ${render.apply(md.renderer, args)}
      </div>
    `;
  };
  return md;
}
