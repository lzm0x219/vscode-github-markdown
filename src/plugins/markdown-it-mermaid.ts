export default function markdownItMermaid(md: markdownit) {
  const defaultRenderer = md.renderer.rules.fence.bind(md.renderer.rules);

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const codeInfo = token.info.trim().split(/\s+/g);
    const [lang] = codeInfo;

    if (lang === "mermaid") {
      const content = token.content.trim();

      if (content) {
        // 创建一个特殊的 <div> 用于前端来进行 Mermaid 渲染
        const mermaidPlaceholder = `<div class="mermaid" data-mermaid-content="${content}"></div>`;
        return mermaidPlaceholder;
      }
    }

    // 执行其他默认行为
    return defaultRenderer(tokens, idx, options, env, self);
  };
}
