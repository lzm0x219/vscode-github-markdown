<p align="right">
  <a href="./README.md">English</a>
</p>

<h1 align="center">GitHub Flavored Markdown</h1>

<p align="center">
  让 VS Code 的 Markdown Preview 尽可能与 GitHub 保持一致。
</p>

<p align="center">
  <img alt="VS Code ^1.74.0" src="https://badges.ws/badge/VS%20Code-%5E1.74.0-007ACC?logo=visualstudiocode&logoColor=white" />
  <img alt="Nub" src="https://badges.ws/badge/Nub-toolkit-f9f1e1" />
  <img alt="Oxc" src="https://badges.ws/badge/Oxc-Linter-32f3e9?logo=oxc&logoColor=white" />
  <img alt="License MIT" src="https://badges.ws/badge/License-MIT-3979E1" />
</p>

> [!NOTE]
> **新增：** 预览一致性现在由严格的浏览器像素级回归测试持续保障。文本块链接也会默认显示与 GitHub 一致的下划线，并支持在设置中关闭。

## 为什么做这个项目

VS Code 自带的 Markdown Preview 更偏通用渲染，而开发者真正关心的，往往是文档发布到 GitHub 之后会呈现成什么样。这个项目的目标不是做一套“类似 GitHub”的 Markdown 主题，而是尽量把 VS Code 里的预览结果和 GitHub 的 Markdown 预览行为与呈现效果对齐。

这样一来，开发者在编写 README、文档页和说明文件时，可以一边编辑，一边直接预览最终预期效果，减少“本地看着没问题，推到 GitHub 才发现版式不对”的来回调整。

这个项目优先解决三件事：

- 对齐 GitHub Markdown 的渲染结果、留白和排版细节，而不是另起一套看起来相似但结果不同的主题
- 尽量让本地预览和 GitHub 上的预期效果保持一致，让文档编写过程更可预期、更省来回验证成本
- 启用 Mermaid 主题同步时，让 `markdown-mermaid` 图表跟随匹配的亮色或暗色主题

## 特性

### GitHub 风格 Markdown

- **任务列表** — `- [x]` 和 `- [ ]` 渲染为 GitHub 风格的禁用复选框。
- **脚注** — `[^1]` 引用自动编号、自动回跳链接，并在文末生成脚注区域。
- **Alerts** — `[!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]` 五种提示框，附带正确的图标和样式。
- **Emoji 短代码** — `:rocket:`、`:+1:`、`:tada:` 等数千个短代码，同时支持 Unicode emoji 和 GitHub 自定义图片 emoji。
- **HTML 图片路径重写** — HTML `<img>` 标签中的绝对路径（`/path/to/img`）会重写为相对路径（`./path/to/img`），让项目本地图片在 VS Code webview 预览中正常显示。

### 经过像素验证的预览一致性

自动化 Chromium 检查会逐像素比较 GitHub 参考渲染和扩展预览。可控 Markdown 用例采用零容差，任何留白、字体、颜色、链接装饰或内容尺寸变化都会触发回归失败。

VS Code 语法高亮，以及 GitHub 为 Mermaid、GeoJSON、STL 和数学公式提供的客户端渲染使用独立差异预算，因为这些视觉结果由宿主应用生成。这些边界仍会持续测量，并在差异超过既定限制时失败。

### GitHub 主题

内置 9 套 GitHub 主题，覆盖亮色、暗色、柔和暗色、高对比度和色觉辅助变体：

| 亮色                            | 暗色                           |
| ------------------------------- | ------------------------------ |
| Light                           | Dark                           |
| Light Protanopia & Deuteranopia | Dark Protanopia & Deuteranopia |
| Light high contrast             | Dark high contrast             |
| Light Tritanopia                | Dark dimmed                    |
|                                 | Dark Tritanopia                |

两种主题模式：

- **单主题** — 始终使用一个固定主题。
- **跟随系统** — 跟随预览环境的亮色/暗色配色，并可分别选择亮色和暗色主题。

随时通过 VS Code 命令（Quick Pick）切换主题，无需打开设置面板。

### Mermaid 图表

启用 `githubMarkdown.mermaid.syncTheme` 后，扩展会更新 `markdown-mermaid` 的亮色/暗色主题设置，使 Mermaid 图表与当前 GitHub Markdown 主题保持匹配。扩展不内置 Mermaid 渲染器，也不引入 Mermaid 运行时依赖。

### 无障碍

文本块中的链接默认显示下划线，与 GitHub 的默认无障碍设置一致。将 `githubMarkdown.accessibility.linkUnderlines` 设为 `false` 可以隐藏链接下划线；两种模式下的脚注引用与回跳链接都不会显示下划线。

## 参与贡献

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发环境配置与贡献指南。

## 许可证

本项目采用 [MIT](./LICENSE) 开源许可证条款进行许可。
