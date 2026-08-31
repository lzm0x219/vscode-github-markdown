# GitHub Markdown 一致性覆盖矩阵

- 核验日期：2026-09-01
- 项目基线：`09f1a827b9b906e15e4a17f5ae2b9fb04f4d968f`

## 结论

当前仓库已经关闭旧基线中的三个 GFM 候选缺口：单波浪线删除线、GFM tagfilter 和 RTL 自动方向。它们都有插件级测试，并通过 VS Code 1.74 桌面、桌面稳定版和 Web 稳定版的 `markdown.api.render` 宿主断言；固定桌面预览与 Web 预览还检查最终 Webview DOM。

脚注不再只有静态 HTML 证据。固定桌面预览和 Web 预览会点击脚注引用、把焦点移到反向链接，并用键盘返回引用。九套主题、System/VS Code 主题模式、内置 Mermaid、KaTeX 长公式以及本地图片也进入了最终预览回归。

这些证据仍不等于 GitHub 页面逐像素或全功能等价。仓库上下文引用、上传、交互式任务、GeoJSON/TopoJSON/STL 等页面增强仍属于 GitHub 服务或客户端渲染器边界；滚动桌面稳定版目前只有 renderer smoke，完整客户端预览固定在 VS Code 1.129.0。

## 证据等级

- **宿主渲染已验证**：真实 VS Code 桌面或 Web Extension Host 调用 `markdown.api.render` 并断言 HTML。
- **最终预览已验证**：真实 Markdown Webview 完成客户端渲染后断言 DOM、交互或布局。
- **本地基线已验证**：单元测试、语义快照或 Chromium parity 已通过，但不能替代宿主结果。
- **集成边界**：行为由 GitHub 服务、VS Code 内置渲染器或可选配套扩展负责，本项目只验证不破坏既有组合。

## 当前覆盖矩阵

| 能力                                                 | 当前责任方                                   | 桌面 1.74 / 桌面稳定 / Web renderer                                | 固定桌面 / Web 最终预览                                              | 剩余边界                                                            |
| ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| CommonMark 基础结构、表格、自动链接、允许的原始 HTML | VS Code 宿主解析，本扩展负责样式             | 常用样例已覆盖，未穷举全部 CommonMark 输入                         | 主题压力 fixture 覆盖标题、表格、链接、代码等主要结构                | GitHub 页面附加属性、完整无障碍 DOM 和相对导航仍需按具体复现补证据  |
| 单、双波浪线删除线                                   | 本扩展 MarkdownIt 插件                       | 已验证；同时覆盖转义、行内代码、未闭合和长波浪线                   | 已验证 `<del>` / `<s>` 及字面量边界                                  | 无已知缺口                                                          |
| GFM tagfilter                                        | 本扩展 MarkdownIt 插件                       | 已验证九类禁用标签；允许的 `strong`、`details`、`picture` 保持可用 | 已验证最终 DOM 不含禁用标签                                          | 这是渲染一致性结论，不据此单独声称安全边界                          |
| RTL 自动方向                                         | 本扩展 MarkdownIt core 规则                  | 已验证标题、段落、混排、列表、提示框和脚注；显式方向保持不变       | 已验证最终 DOM；代码节点不添加方向属性                               | 更复杂的双向文本视觉效果仍按复现扩充                                |
| 任务列表、五类提示框、Emoji                          | 本扩展插件                                   | 基本项已验证                                                       | 主题压力 fixture 已覆盖                                              | GitHub Issue 中的交互式任务和自定义 Emoji 图像属于平台边界          |
| 脚注                                                 | 本扩展插件                                   | RTL 脚注语义已验证                                                 | 引用、定义、反向链接、点击与键盘返回已验证                           | 复杂嵌套与浏览器辅助技术组合未穷举                                  |
| 九套 GitHub 主题                                     | 本扩展主题容器与 CSS                         | 主题模式和样式贡献可达                                             | 九套 Single 主题、System 亮暗/高对比度切换、VS Code 主题模式均已验证 | 不是九套主题对 GitHub 页面的逐像素截图证明                          |
| Mermaid                                              | VS Code 内置或外置渲染器；本扩展同步亮暗主题 | renderer smoke 不执行客户端图表                                    | 固定桌面与 Web 均要求生成含预期节点的 SVG，并验证亮暗调色板切换      | 外置 `bierner.markdown-mermaid` 的旧宿主组合仍只有契约测试          |
| 数学公式                                             | VS Code 内置 KaTeX                           | renderer smoke 不执行客户端公式                                    | 固定桌面与 Web 均验证公式可见、源码完整、页面只有一个纵向滚动区      | GitHub 使用的渲染实现与 VS Code 不同，不承诺逐像素等价              |
| 根路径/相对图片与 `srcset`                           | 本扩展 URL 改写 + VS Code Webview            | renderer 语义和插件测试已覆盖                                      | 固定桌面与 Web 验证图片实际加载及根路径候选被改写                    | GitHub CDN、上传和权限上下文不在本地预览范围                        |
| 代码语法高亮                                         | VS Code 宿主                                 | 作为宿主输出接受                                                   | 主题压力 fixture 只验证可读和不破坏布局                              | 不承诺与 GitHub 的高亮引擎逐 token 等价                             |
| GeoJSON、TopoJSON、STL                               | GitHub 页面或第三方渲染器                    | 不适用                                                             | 未实现                                                               | 保持 integration boundary，不因 GitHub 页面支持而在扩展内复制运行时 |
| 提及、Issue/PR/提交引用、上传、颜色预览、交互式任务  | GitHub 服务与页面上下文                      | 不适用                                                             | 不适用                                                               | 明确排除，除非未来建立独立产品目标与可复现上下文                    |

## 当前优先级

1. **滚动宿主漂移**：继续运行桌面稳定版 smoke 和每日 Insiders canary；出现具体失败后再扩大最终预览矩阵。
2. **旧 Mermaid 组合**：若仍需承诺 VS Code 1.100–1.120 与外置渲染器，增加固定扩展版本的桌面/Web 端到端测试。
3. **证据广度**：按真实 Issue 扩充表格无障碍结构、相对导航、复杂脚注和双向文本，不机械复制所有语法排列。
4. **视觉边界**：客户端 Mermaid、KaTeX 和语法高亮维持语义、可读性与布局断言，不升级为无法稳定维护的逐像素承诺。

## 仓库证据

- 插件链：[src/markdown-it.ts](../../../src/markdown-it.ts)
- renderer 宿主断言：[tests/host/smoke.ts](../../../tests/host/smoke.ts)
- 最终预览语义与交互：[scripts/host/preview.ts](../../../scripts/host/preview.ts)
- Mermaid、KaTeX 与滚动布局：[scripts/host/client-rendering.ts](../../../scripts/host/client-rendering.ts)
- 宿主矩阵：[.github/workflows/ci.yml](../../../.github/workflows/ci.yml)
- Insiders 漂移探针：[.github/workflows/host-canary.yml](../../../.github/workflows/host-canary.yml)
- parity 能力与边界：[scripts/parity/cases.ts](../../../scripts/parity/cases.ts)

## 上游资料

- [GFM 规范 0.29](https://github.github.com/gfm/)
- [GitHub Markdown REST API](https://docs.github.com/en/rest/markdown/markdown)
- [GitHub 基本写作与格式语法](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [GitHub 图表](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- [GitHub 数学表达式](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions)
- [VS Code Markdown 扩展贡献点](https://code.visualstudio.com/api/extension-guides/markdown-extension)
