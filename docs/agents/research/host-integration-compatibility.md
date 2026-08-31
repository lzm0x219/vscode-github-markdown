# 跨宿主与伴生渲染器兼容矩阵

- 核验日期：2026-09-01
- 项目基线：`09f1a827b9b906e15e4a17f5ae2b9fb04f4d968f`

## 结论摘要

1. **桌面与 Web 已共享同一扩展实现和同一组 GFM 语义契约。** VS Code 1.74.0、桌面稳定版和 Web 稳定版运行 renderer smoke；固定桌面 1.129.0 与 Web 稳定版还运行真实 Markdown Webview 预览。
2. **旧基线的内置 Mermaid 断点已经关闭。** 同步逻辑同时识别 `vscode.mermaid-markdown-features` 与 `bierner.markdown-mermaid`；固定桌面和 Web 预览要求 Mermaid 生成 SVG，并验证亮暗调色板随主题切换。
3. **System 模式已经使用 VS Code Webview 主题类。** 生成 CSS 同时处理 `body.vscode-light`、`body.vscode-dark` 和两类高对比度主题；宿主预览会真实切换 VS Code 主题并等待对应调色板。
4. **KaTeX 长内容已有回归门禁。** 固定桌面和 Web 预览要求公式可见、源表达式完整、页面可滚动且不存在第二个纵向滚动容器。
5. **当前主要风险已从“功能未知”转为“矩阵边缘”。** 滚动桌面稳定版只有 renderer smoke，旧版外置 Mermaid 没有端到端组合测试，多窗口下的设置所有权仍依赖单元契约。

## 宿主矩阵

| 宿主                                | 运行方式                               | 当前验证                                                                                                                  | 未覆盖                                                               |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 桌面 VS Code 1.74.0                 | `@vscode/test-electron` renderer smoke | 扩展激活、插件链、主题模式、单/双删除线、tagfilter、RTL、脚注语义                                                         | 内置 Mermaid/KaTeX 客户端渲染；该版本本身不提供当前内置 Mermaid 组合 |
| 桌面稳定版                          | `@vscode/test-electron` renderer smoke | 与最低版相同，用于发现当前稳定 API 漂移                                                                                   | 不执行完整 Webview、九主题压力、脚注交互和客户端渲染器               |
| 桌面 VS Code 1.129.0                | Playwright 驱动真实 VS Code            | 最终 GFM DOM、脚注点击/键盘导航、九套 Single 主题、System 亮暗/高对比度、VS Code 主题模式、Mermaid、KaTeX、图片和滚动布局 | 固定版本不会自动证明未来稳定版行为                                   |
| Web 稳定版                          | `@vscode/test-web` + Chromium          | renderer smoke 与完整最终预览；使用与桌面相同的语义、主题、客户端渲染和布局断言                                           | 不能代表所有浏览器、远程权限或 `github.dev` 仓库上下文               |
| VS Code Insiders                    | 每日计划任务                           | renderer smoke；失败时创建或更新去重 Issue                                                                                | 不执行完整最终预览，因此主要用于提前发现 API/解析漂移                |
| 旧宿主 + `bierner.markdown-mermaid` | 单元与设置契约                         | 扩展 ID、主题槽位、恢复和用户接管语义                                                                                     | 未安装固定版本配套扩展运行桌面/Web 端到端图表测试                    |

## 主题与渲染器契约

| GitHub 主题类别                                                                   | 正文主题                 | Mermaid 同步值 | 最终预览证据                                                                  |
| --------------------------------------------------------------------------------- | ------------------------ | -------------- | ----------------------------------------------------------------------------- |
| `light`、`light_colorblind`、`light_high_contrast`、`light_tritanopia`            | 保留各自 GitHub CSS 变量 | `default`      | 四套 Single 主题都进入压力矩阵；System 亮色与高对比度亮色使用 VS Code body 类 |
| `dark`、`dark_colorblind`、`dark_dimmed`、`dark_high_contrast`、`dark_tritanopia` | 保留各自 GitHub CSS 变量 | `dark`         | 五套 Single 主题都进入压力矩阵；System 暗色与高对比度暗色使用 VS Code body 类 |

Mermaid 的契约是保持亮暗方向和可读性，不是复制 GitHub 每套图表配色。KaTeX 的契约是正确渲染、表达式完整和不制造第二个页面滚动区，不是与 GitHub MathJax 逐像素一致。

## 已关闭的旧风险

### 内置 Mermaid 扩展 ID 漂移

`src/integrations/mermaid.ts` 同时识别内置与外置扩展 ID；渲染器移除或禁用时会释放仍由本扩展拥有的设置。固定桌面和 Web 最终预览验证 SVG 及亮暗调色板，避免只凭设置单测宣称兼容。

### System 与 VS Code 主题信号脱节

`scripts/build/github-css.ts` 为 System 模式生成 VS Code 亮、暗和高对比度 body 类选择器。最终预览通过命令切换 VS Code 主题，检查容器元数据、正文压力 fixture 与 Mermaid 调色板。

### KaTeX 双滚动条回归

`scripts/host/client-rendering.ts` 使用长公式 fixture，验证 KaTeX 可见尺寸、源表达式、主页面滚动和嵌套纵向滚动器数量。历史 Issue #604 继续作为背景，不再描述为“当前待确认缺陷”。

## 当前待优化项

1. **稳定版最终预览策略**：固定 1.129.0 保证可复现，稳定/Insiders smoke 保证低成本漂移提示；只有出现 renderer 与客户端行为分叉的证据时，再增加滚动最终预览任务。
2. **外置 Mermaid 端到端**：若产品继续承诺旧宿主组合，应固定 `bierner.markdown-mermaid` 版本并在其支持的桌面/Web 宿主运行图表与主题切换。
3. **设置所有权组合**：继续用多窗口、同步期间用户修改设置、安装/禁用渲染器的复现驱动改动；不在没有失败证据时重写现有事务模型。
4. **浏览器与远程上下文**：Web CI 证明 Web Extension Host 兼容，不等于所有浏览器、Codespaces、`vscode.dev` 和 `github.dev` 权限组合。

## 范围边界

- 不创建自定义 Markdown 预览或 Webview；继续使用 VS Code 的 Markdown 贡献点。
- 不内置 Mermaid 或 KaTeX 运行时；本扩展维护主题和布局兼容契约。
- 不把 Notebook、Chat、独立 Mermaid 编辑器、GeoJSON/TopoJSON/STL 客户端渲染纳入当前宿主矩阵。
- 不把 DOM/交互断言表述为 GitHub 页面逐像素等价。

## 仓库证据

- 宿主 CI：[.github/workflows/ci.yml](../../../.github/workflows/ci.yml)
- Insiders canary：[.github/workflows/host-canary.yml](../../../.github/workflows/host-canary.yml)
- renderer smoke：[tests/host/smoke.ts](../../../tests/host/smoke.ts)
- 最终预览与主题压力：[scripts/host/preview.ts](../../../scripts/host/preview.ts)
- Mermaid、KaTeX 与滚动布局：[scripts/host/client-rendering.ts](../../../scripts/host/client-rendering.ts)
- Mermaid 设置同步：[src/integrations/mermaid.ts](../../../src/integrations/mermaid.ts)
- 主题 CSS 生成：[scripts/build/github-css.ts](../../../scripts/build/github-css.ts)
- 固定宿主版本：[scripts/host/versions.ts](../../../scripts/host/versions.ts)

## 上游资料

- [VS Code Markdown 扩展贡献点](https://code.visualstudio.com/api/extension-guides/markdown-extension)
- [VS Code Web 扩展](https://code.visualstudio.com/api/extension-guides/web-extensions)
- [VS Code Webview 主题](https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content)
- [VS Code 1.121 内置 Mermaid](https://code.visualstudio.com/updates/v1_121#_mermaid-diagrams-in-markdown-preview-and-notebooks)
- [VS Code Markdown 数学公式](https://code.visualstudio.com/docs/languages/markdown#_math-formula-rendering)
- [GitHub 图表](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- [历史 Mermaid 冲突 Issue #203](https://github.com/lzm0x219/vscode-github-markdown/issues/203)
- [历史 KaTeX 双滚动条 Issue #604](https://github.com/lzm0x219/vscode-github-markdown/issues/604)
