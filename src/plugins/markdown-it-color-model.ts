import isColor from "is-color";

export default function markdownItColorModel(md: markdownit) {
  const defaultRenderer = md.renderer.rules.code_inline.bind(md.renderer.rules);
  md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (isColor(token.content)) {
      return `
      <code class="notranslate">${token.content}<span class="ml-1 d-inline-block border circle color-border-subtle" style="background-color: ${token.content}; height: 10px; width: 10px;"></span></code>`;
    }
    // 执行其他默认行为
    return defaultRenderer(tokens, idx, options, env, self);
  };
}
