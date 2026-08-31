import type MarkdownIt from "markdown-it";
import { getLinkUnderlines } from "../accessibility";
import { getResolvedTheme } from "../theme";

export default function markdownItGitHubTheme(md: MarkdownIt): MarkdownIt {
  const render = md.renderer.render.bind(md.renderer);

  md.renderer.render = function (...args) {
    const theme = getResolvedTheme();
    return `
      <div
        class="vscode-github-markdown"
        data-color-mode="${theme.colorMode}"
        data-light-theme="${theme.light}"
        data-dark-theme="${theme.dark}"
        data-link-underlines="${getLinkUnderlines()}"
      >
        ${render.apply(md.renderer, args)}
      </div>
    `;
  };
  return md;
}
