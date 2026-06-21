# GitHub Flavored Markdown — 兼容性验证清单

> **用途：** 在 VS Code 中打开下列文件，使用 `vscode-github-markdown` 预览，与 GitHub 上的渲染结果逐项对比。
>
> **参考文档：**
>
> - [基本写作和格式语法](https://docs.github.com/zh/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
> - [使用高级格式](https://docs.github.com/zh/get-started/writing-on-github/working-with-advanced-formatting)

## 功能清单

- [一、基础排版](./github-flavored-markdown/01-basic-formatting.md)
- [二、链接与引用](./github-flavored-markdown/02-links-and-references.md)
- [三、代码与颜色](./github-flavored-markdown/03-code-and-color.md)
- [四、列表](./github-flavored-markdown/04-lists.md)
- [五、表格](./github-flavored-markdown/05-tables.md)
- [六、引用与 Alerts](./github-flavored-markdown/06-quotes-and-alerts.md)
- [七、图片与媒体](./github-flavored-markdown/07-images-and-media.md)
- [八、折叠区块](./github-flavored-markdown/08-collapsible-sections.md)
- [九、表情符号](./github-flavored-markdown/09-emoji.md)
- [十、脚注](./github-flavored-markdown/10-footnotes.md)
- [十一、GitHub 专属功能](./github-flavored-markdown/11-github-platform-features.md)
- [十二、HTML 元素](./github-flavored-markdown/12-html-elements.md)

---

# 数据验证矩阵

> 以下注释用于自动化验证——每行对应一个需检测的渲染产物。

<!-- TASK_LIST: verify class="contains-task-list" and checkbox inputs -->
<!-- FOOTNOTES: verify class="footnote-ref", class="footnote-backref", section.footnotes -->
<!-- ALERTS: verify class="markdown-alert" and alert type classes -->
<!-- HEADINGS: verify h1-h6 rendering and heading anchors -->
<!-- CODE_BLOCKS: verify fenced code blocks with language identifiers -->
<!-- TABLES: verify table alignment classes -->
<!-- EMOJI: verify emoji shortcode rendering -->
<!-- STRIKETHROUGH: verify ~~ del tag rendering -->
<!-- ESCAPING: verify backslash escaping behavior -->
<!-- DETAILS: verify <details>/<summary> HTML rendering -->
<!-- MERMAID: verify mermaid diagram language support -->
<!-- MATH: verify LaTeX math expression rendering -->
<!-- AUTOLINK: verify URL auto-linking behavior -->
<!-- KEYWORDS: verify closes/fixes/resolves keyword behavior -->
