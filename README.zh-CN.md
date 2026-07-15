<p align="right">
  <a href="./README.md">English</a>
</p>

<h1 align="center">GitHub Flavored Markdown Preview</h1>

<p align="center">
  让 VS Code 的 Markdown Preview 尽可能与 GitHub 保持一致。
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=lzm0x219.vscode-github-markdown"><img alt="VS Marketplace 版本" src="https://badges.ws/vscode/v/lzm0x219.vscode-github-markdown?label=Marketplace&labelColor=24292F" /></a>
  <a href="#桌面端与-web"><img alt="支持桌面端与 Web 扩展宿主" src="https://badges.ws/badge/Hosts-Desktop%20%2B%20Web-BC4C00?labelColor=24292F" /></a>
  <a href="https://github.com/lzm0x219/vscode-github-markdown/actions/workflows/ci.yml"><img alt="CI 状态" src="https://badges.ws/github/actions/workflow/status/lzm0x219/vscode-github-markdown/ci.yml?branch=main&label=CI&labelColor=24292F" /></a>
  <a href="./LICENSE"><img alt="MIT 许可证" src="https://badges.ws/badge/License-MIT-8250DF?labelColor=24292F" /></a>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=lzm0x219.vscode-github-markdown"><strong>从 Visual Studio Marketplace 安装</strong></a>
</p>

## 快速开始

通过上方 Marketplace 链接安装，或在终端运行：

```shell
code --install-extension lzm0x219.vscode-github-markdown
```

打开 Markdown 文件，然后运行 **Markdown: Open Preview to the Side**。扩展会增强 VS Code 内置预览的 GitHub 兼容渲染与样式，不会另建一套预览编辑器。

<table>
  <tr>
    <th>GitHub 参考效果</th>
    <th>扩展渲染管线</th>
  </tr>
  <tr>
    <td><img alt="GitHub 渲染的 Markdown" src="./assets/parity-github.png" /></td>
    <td><img alt="扩展管线渲染的 Markdown" src="./assets/parity-vscode.png" /></td>
  </tr>
</table>

以上图片来自自动化一致性测试：它会在相同 Chromium 条件下分别渲染已提交的 GitHub 参考内容与扩展的 Markdown/CSS 管线。真实 VS Code 桌面端和 Web 宿主则由针对内置 Markdown 渲染贡献点的独立冒烟测试覆盖。

> [!IMPORTANT]
> 正在从 `lzm0x219.vscode-markdown-github` 迁移？新版使用独立的扩展 ID。请先安装 `lzm0x219.vscode-github-markdown`，确认 Markdown 预览符合预期，再卸载旧扩展，避免两者同时修改预览。

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
- **删除线** — `~文本~` 会渲染为 GitHub 风格删除线，同时保留既有的 `~~文本~~` 语法、转义和行内代码行为。
- **GFM Tagfilter** — `<title>`、`<script>`、`<iframe>` 等原始标签会像 GitHub 一样显示为文本，同时保留受允许 HTML 的渲染行为。
- **自动文本方向** — 阿拉伯语等从右到左或混排内容会采用与 GitHub 一致的自动方向，同时保持代码和显式方向不变。
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

启用 `githubMarkdown.mermaid.syncTheme` 且已安装 `markdown-mermaid` 时，扩展会同时更新该扩展的亮色和暗色主题设置。跟随系统模式会分别映射所选的 GitHub 亮色与暗色主题；单主题模式会为两种预览配色应用同一个匹配主题。关闭同步后，扩展会恢复此前的 Mermaid 全局设置。本扩展不内置 Mermaid 渲染器，也不引入 Mermaid 运行时依赖。

### 桌面端与 Web

扩展运行时代码同时兼容桌面和 Web 扩展宿主。CI 会对最低支持的 VS Code 桌面版本、当前稳定版桌面宿主和稳定版浏览器宿主执行冒烟测试。

### 无障碍

文本块中的链接默认显示下划线，与 GitHub 的默认无障碍设置一致。将 `githubMarkdown.accessibility.linkUnderlines` 设为 `false` 可以隐藏链接下划线；两种模式下的脚注引用与回跳链接都不会显示下划线。

## 相关资料

- [Visual Studio Code 的 Markdown 支持](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown 语法参考](https://docs.github.com/zh/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [Emoji 速查表](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md)

## 参与贡献

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发环境配置与贡献指南。

## 许可证

本项目采用 [MIT](./LICENSE) 开源许可证条款进行许可。
