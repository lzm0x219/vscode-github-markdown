export default function markdownItGitHubTheme(md: markdownit) {
  const render = md.renderer.render;

  md.renderer.render = function (...args) {
    return `
      <div class="vscode-github-markdown" data-theme="">
        ${render.apply(md.renderer, args)}
      </div>
    `;
  };
  return md;
}
