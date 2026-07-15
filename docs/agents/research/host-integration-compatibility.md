# 跨宿主与伴生渲染器兼容矩阵

- 调研日期：2026-07-15
- 项目基线：`04bbb46aaa7e7bf03ade8ddab83f804b826e2903`

## 结论摘要

1. **桌面端与 Web 端的基础扩展路径可用，但验证深度不足。** `main` 与 `browser` 指向同一 bundle；CI 在 VS Code 1.74.0、桌面稳定版和 Web 稳定版中验证激活、Markdown-it 插件链与预览样式文件。现有宿主测试没有验证九套主题的实际 CSS、运行时配色切换、Mermaid 或 KaTeX 的最终渲染。[扩展清单](../../../package.json)、[宿主 smoke](../../../tests/host/smoke.ts)、[CI](../../../.github/workflows/ci.yml)
2. **VS Code 1.121 及以上存在已确认的 Mermaid 主题同步断点。** VS Code 1.121 将原 `markdown-mermaid` 合并为内置的 `vscode.mermaid-markdown-features`；它沿用 `markdown-mermaid.lightModeTheme` 和 `markdown-mermaid.darkModeTheme` 设置。当前实现却先检查 `bierner.markdown-mermaid` 是否存在，不存在便返回，因此只安装新内置扩展时不会同步 GitHub 主题。新内置扩展的两个槽位默认都是 `vscode`，而不是本项目期望的 `default`/`dark`。[VS Code 1.121 发布说明](https://code.visualstudio.com/updates/v1_121#_mermaid-diagrams-in-markdown-preview-and-notebooks)、[内置扩展清单（固定版本）](https://github.com/microsoft/vscode/blob/bc2ac764ddd66802104366c182d490a03253f7e1/extensions/mermaid-markdown-features/package.json)、[当前同步实现](../../../src/integrations/mermaid.ts)
3. **九套 GitHub 主题的正文选择逻辑完整，Mermaid 只保持亮暗方向而非主题等价。** 四套亮色主题全部映射为 Mermaid `default`，五套暗色主题全部映射为 `dark`；色盲、高对比度、Tritanopia 与 Dimmed 的差异不会传递给 Mermaid。这符合当前 README 所承诺的“匹配亮色或暗色”，但不能证明与 GitHub 的图表配色一致。[主题逻辑](../../../src/theme.ts)、[Mermaid 映射](../../../src/integrations/mermaid.ts)、[README](../../../README.md#mermaid-diagrams)
4. **System 模式依赖 CSS `prefers-color-scheme`，而不是 VS Code 明示的 Webview 主题类。** VS Code 官方为当前编辑器主题提供 `body.vscode-light`、`body.vscode-dark`、`body.vscode-high-contrast`；本项目生成的主题 CSS 只使用亮/暗媒体查询。操作系统自动配色时两者预期趋同，但手动切换 VS Code 主题、高对比度切换以及桌面/Web 是否完全一致仍缺少真实宿主证据，不能视为已验证。[主题 CSS 生成](../../../scripts/build/github-css.ts)、[VS Code Webview 主题契约](https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content)、[VS Code 自动配色说明](https://code.visualstudio.com/docs/configure/themes#_automatically-switch-based-on-os-color-scheme)
5. **KaTeX 是应保留的回归边界，不是已确认的新缺陷。** VS Code 当前内置预览使用 KaTeX；项目历史 [Issue #604](https://github.com/lzm0x219/vscode-github-markdown/issues/604) 记录过长公式导致双滚动条。该问题已关闭，当前代码没有专门的真实宿主回归测试，因此 v4.3 应先复现再决定是否改 CSS。[VS Code Markdown 数学公式说明](https://code.visualstudio.com/docs/languages/markdown#_math-formula-rendering)

## 范围与风险定义

- **高：** 已有源码级确定性冲突，或会使 GitHub 可渲染内容退化、主题明显错误、预览不可用。
- **中：** 基础路径存在，但缺少真实宿主/切换/组合验证，或历史上发生过用户可见故障。
- **低：** 当前实现和至少一层宿主测试一致，剩余风险主要是视觉覆盖不足。
- “当前行为”区分“由测试证明”和“由源码推断”；未在真实宿主复现的项目明确标为待验证。

GitHub 的目标行为是：`mermaid` 围栏代码块在 Markdown 文件、Issue、PR、Discussion 和 Wiki 中渲染为图表，而不是普通代码块。GitHub 同时提醒第三方 Mermaid 插件可能产生错误，因此本项目应验证组合行为，不能只验证单个插件输出。[GitHub 图表文档](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams#creating-mermaid-diagrams)

## 兼容矩阵

| 宿主                                           | 主题模式                                | 伴生/宿主渲染器                             | 预期行为                                                                         | 当前行为与证据                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 风险                           |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 桌面 VS Code 1.74.0                            | Single，九主题任一                      | 无                                          | 扩展激活，GitHub 语法插件和固定主题生效                                          | CI 真实宿主 smoke 覆盖激活、插件链和样式文件；未截图或检查最终主题变量。[CI](../../../.github/workflows/ci.yml)、[宿主 smoke](../../../tests/host/smoke.ts)                                                                                                                                                                                                                                                                                                                    | 低（功能）/中（视觉）          |
| 桌面稳定版                                     | Single，九主题任一                      | 无                                          | 与最低版本相同，且跟随当前 VS Code Markdown API                                  | CI 有稳定版 smoke；测试内容不含主题断言、Mermaid 或数学公式。[宿主 smoke](../../../tests/host/smoke.ts)                                                                                                                                                                                                                                                                                                                                                                        | 低（功能）/中（视觉）          |
| Web 稳定版（`vscode.dev`/`github.dev` 类环境） | Single，九主题任一                      | 无                                          | 与桌面端产生相同插件 HTML 和 GitHub 主题                                         | `browser` 入口和 WebWorker 宿主 smoke 已覆盖；同一 bundle 避免了实现分叉，但测试仍只验证插件 HTML 与样式存在。[扩展清单](../../../package.json)、[CI](../../../.github/workflows/ci.yml)、[VS Code Web 扩展契约](https://code.visualstudio.com/api/extension-guides/web-extensions#web-extension-main-file)                                                                                                                                                                    | 低（功能）/中（视觉）          |
| 桌面与 Web                                     | System，普通亮/暗系统配色               | 无                                          | 操作系统配色变化时，在配置的 GitHub 亮/暗主题之间切换                            | 包装元素写入 `data-color-mode="auto"`，生成 CSS 使用 `prefers-color-scheme`；单测只断言属性，没有在真实宿主触发切换。[主题插件](../../../src/plugins/markdown-it-github-theme.ts)、[主题单测](../../../tests/theme.test.ts)                                                                                                                                                                                                                                                    | 中，待真实宿主验证             |
| 桌面与 Web                                     | System，手动切换 VS Code 主题或高对比度 | 无                                          | 必须明确产品语义：跟随 OS，或跟随当前 VS Code 主题；无论选哪一种都应在两宿主一致 | 官方 Webview 契约提供 VS Code 当前主题类及独立高对比度类别；当前 CSS 未使用这些信号，只区分媒体查询亮/暗。是否产生实际错配待复现。[VS Code Webview 主题契约](https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content)                                                                                                                                                                                                                               | 中                             |
| 桌面与 Web，VS Code 1.100–1.120                | Single                                  | 外置 `bierner.markdown-mermaid` 当前版      | Mermaid 图表渲染；两个 Mermaid 槽位都与固定 GitHub 主题保持同一亮暗方向          | 当前实现把两个槽位都写为 `default` 或 `dark`；单元测试覆盖映射和恢复。外置扩展同时提供 `main`、`browser`、Markdown 插件和预览脚本，但项目没有真实双扩展宿主测试。[Mermaid 单测](../../../tests/integrations/mermaid.test.ts)、[外置扩展清单（固定版本）](https://github.com/mjbvz/vscode-markdown-mermaid/blob/9f4d37ded0cc7fdf05bbab17fb082a6fc118e269/package.json)                                                                                                          | 中                             |
| 桌面与 Web，VS Code 1.100–1.120                | System                                  | 外置 `bierner.markdown-mermaid` 当前版      | Mermaid 分别使用与 GitHub 亮/暗槽位相符的主题，并可恢复用户原值                  | 源码与单测证明首次同步会保存全局值、写入 `default`/`dark`，关闭同步后恢复；尚未验证多窗口、用户在同步期间修改 Mermaid 设置或 Web 宿主重载。[同步实现](../../../src/integrations/mermaid.ts)、[Mermaid 单测](../../../tests/integrations/mermaid.test.ts)                                                                                                                                                                                                                       | 中                             |
| 桌面与 Web，VS Code 1.121+                     | Single 或 System                        | 内置 `vscode.mermaid-markdown-features`     | Mermaid 图表渲染且继续与选定 GitHub 主题保持亮暗一致                             | 图表由 VS Code 内置扩展渲染；本项目只查找旧 ID，所以主题同步提前返回。内置扩展沿用设置键，但默认两个槽位均为 `vscode`。这是源码级可复现断点。[VS Code 1.121 发布说明](https://code.visualstudio.com/updates/v1_121#_mermaid-diagrams-in-markdown-preview-and-notebooks)、[内置扩展清单](https://github.com/microsoft/vscode/blob/bc2ac764ddd66802104366c182d490a03253f7e1/extensions/mermaid-markdown-features/package.json)、[同步实现](../../../src/integrations/mermaid.ts) | **高**                         |
| 桌面与 Web                                     | Single 或 System                        | VS Code 内置 KaTeX                          | 长公式正常渲染，页面只有一个主滚动容器，正文主题不破坏公式可读性                 | 官方确认内置预览使用 KaTeX；历史 Issue 曾出现双滚动条，当前宿主 smoke 与视觉 parity 都没有执行真实 KaTeX 客户端渲染。[Issue #604](https://github.com/lzm0x219/vscode-github-markdown/issues/604)、[平台边界定义](../../../scripts/parity/cases.ts)                                                                                                                                                                                                                             | 中，待复现                     |
| 桌面与 Web                                     | 任意                                    | GeoJSON、TopoJSON、STL 或其他第三方预览脚本 | 不破坏宿主或第三方渲染；是否追求 GitHub 功能等价由一致性覆盖矩阵决定             | GitHub 支持这些客户端渲染器；本项目只保留源代码块并把它们列为 integration boundary，没有伴生扩展或历史 Issue 证明应在 v4.3 实现。[GitHub 图表文档](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)、[平台边界测试](../../../tests/scripts/parity/platform-features.test.ts)                                                                                                                                       | 中（验证缺口），不直接纳入实现 |

## 九主题映射

| GitHub 主题           | 类别 | Single 正文选择            | System 槽位 | 外置 Mermaid 同步值 | VS Code 1.121+ 内置 Mermaid 当前结果 |
| --------------------- | ---- | -------------------------- | ----------- | ------------------- | ------------------------------------ |
| `light`               | 亮   | 固定 `light`               | light       | `default`           | 不由本扩展更新；新配置默认 `vscode`  |
| `light_colorblind`    | 亮   | 固定 `light_colorblind`    | light       | `default`           | 同上                                 |
| `light_high_contrast` | 亮   | 固定 `light_high_contrast` | light       | `default`           | 同上                                 |
| `light_tritanopia`    | 亮   | 固定 `light_tritanopia`    | light       | `default`           | 同上                                 |
| `dark`                | 暗   | 固定 `dark`                | dark        | `dark`              | 同上                                 |
| `dark_colorblind`     | 暗   | 固定 `dark_colorblind`     | dark        | `dark`              | 同上                                 |
| `dark_dimmed`         | 暗   | 固定 `dark_dimmed`         | dark        | `dark`              | 同上                                 |
| `dark_high_contrast`  | 暗   | 固定 `dark_high_contrast`  | dark        | `dark`              | 同上                                 |
| `dark_tritanopia`     | 暗   | 固定 `dark_tritanopia`     | dark        | `dark`              | 同上                                 |

正文映射由 [主题实现](../../../src/theme.ts) 和 [主题 CSS 生成器](../../../scripts/build/github-css.ts)确定；Mermaid 映射由 [集成实现](../../../src/integrations/mermaid.ts)确定。当前单测覆盖九主题枚举和亮暗分支，但没有逐主题真实宿主截图。[主题单测](../../../tests/theme.test.ts)

## 可复现的高影响不一致

### 1. VS Code 1.121+ 内置 Mermaid 不再同步主题（已确认）

复现前提：VS Code 1.121 或以上，不安装已弃用的外置 `bierner.markdown-mermaid`。

1. 保持 `githubMarkdown.mermaid.syncTheme = true`。
2. 选择 Single `dark_dimmed`，或在 System 中配置任意 GitHub 亮/暗主题。
3. 打开含 `mermaid` 围栏代码块的 Markdown 预览。
4. 内置 Mermaid 能渲染图表，但 `updateMermaidThemeSync` 因找不到旧扩展 ID 而在读取设置前返回；`markdown-mermaid.*ModeTheme` 不会被本项目更新。

影响：v4 当前稳定宿主的 Mermaid 图表会使用内置扩展的有效主题（新配置默认 `vscode`），而不是项目声明的 GitHub 主题亮暗映射。功能没有退化为代码块，但主题一致性承诺失效。

### 2. System 模式与 VS Code 手动主题/高对比度的关系不明确（待真实宿主确认）

候选复现：固定 OS 为亮色，System 模式配置 `light`/`dark`，手动把 VS Code 从亮色切到暗色及高对比度，再分别观察桌面与 Web 预览。当前 CSS 只读 `prefers-color-scheme`，而官方推荐的当前 VS Code 主题信号是 `body.vscode-*`。在完成真实宿主验证前，不断言一定错配；但这必须在 v4.3 确定语义并锁定测试。

### 3. 长 KaTeX 内容可能再次产生双滚动条（历史高影响回归，当前待确认）

使用 [Issue #604](https://github.com/lzm0x219/vscode-github-markdown/issues/604) 的长公式场景，在桌面稳定版和 Web 稳定版打开预览，检查页面与公式容器的滚动区域。旧问题已关闭，只有当前版本复现后才能创建 CSS 修复 Ticket；无复现时只保留回归测试。

## 建议纳入 v4.3 的范围

### P0：兼容 VS Code 1.121+ 内置 Mermaid

可拆为独立实现 Ticket：

- 同时识别内置 `vscode.mermaid-markdown-features` 与旧 `bierner.markdown-mermaid`，或改为以设置能力检测为准；不得提高 `engines.vscode`。
- 保持现有设置键和关闭同步时的恢复语义，补充旧扩展、内置扩展、两者均不存在三类单测。
- 在桌面稳定版与 Web 稳定版真实渲染 Mermaid，验证 Single/System 的亮暗切换；最低版宿主继续验证无 Mermaid 依赖时扩展可用。

### P1：建立真实宿主主题与客户端渲染回归

可拆为独立测试 Ticket：

- 桌面最低版、桌面稳定版、Web 稳定版继续作为宿主轴。
- 以四个亮色与五个暗色的 DOM 主题属性全覆盖；视觉验证至少覆盖普通、色盲、高对比度、Dimmed/Tritanopia 各类别，不把九主题只压缩成一个亮暗样例。
- System 模式分别验证浏览器/OS 亮暗切换、VS Code 手动主题切换和高对比度；根据结果明确“跟随 OS”还是“跟随 VS Code 当前主题”。
- 在稳定宿主加入 Mermaid 与长 KaTeX 内容，断言不是原始代码块、文本可读且不存在第二个页面滚动条。

### P2：收紧 Mermaid 设置所有权（复现后实施）

当前同步写入 `ConfigurationTarget.Global`，只监听 `githubMarkdown` 配置变化，并用一次性快照恢复。先用多窗口、同步期间用户修改 Mermaid 设置、安装/禁用渲染器三种场景验证；只有证明会覆盖新值或跨窗口漂移后，再拆分实现 Ticket，避免凭假设重构。

## 依赖与排除项

### 依赖

- 版本范围汇总应读取“一致性覆盖矩阵”对 GeoJSON、STL、数学等平台功能的归属决定；本调研只确定组合风险，不替代功能差距排序。
- P0 依赖 VS Code 1.121 的内置扩展清单作为上游契约，同时必须保留旧扩展路径以覆盖最低版本区间。
- P1 可与 P0 并行搭建，但内置 Mermaid 的通过断言要等 P0 完成。

### 排除

- 不创建自定义 Markdown 预览或 Webview；继续使用 VS Code 的 `markdown.markdownItPlugins`、`markdown.previewStyles` 与宿主脚本组合契约。[VS Code Markdown 扩展指南](https://code.visualstudio.com/api/extension-guides/markdown-extension)
- 不重新内置 Mermaid 运行时。VS Code 1.121+ 已内置；旧版本继续通过可选伴生扩展兼容。
- 不在没有用户/源码证据时新增 GeoJSON、TopoJSON、STL 伴生渲染器。
- 不承诺 Mermaid、KaTeX 等宿主客户端渲染器的逐像素等价；v4.3 的门槛是正确渲染、主题方向一致、可读、无布局破坏。
- 不把 Notebook、Chat 或独立 Mermaid 编辑器纳入本项目范围；本项目贡献点只面向 VS Code 内置 Markdown 预览。

## 验证方式与通过标准

| 轴           | 最小验证                                   | 通过标准                                                            |
| ------------ | ------------------------------------------ | ------------------------------------------------------------------- |
| 桌面最低版   | VS Code 1.74.0 宿主 smoke                  | 扩展激活、插件链与样式存在；未安装 Mermaid 渲染器时无异常           |
| 桌面稳定版   | 内置 Markdown 预览端到端                   | 九主题元数据正确；Single/System 切换刷新；Mermaid 和 KaTeX 正常渲染 |
| Web 稳定版   | `@vscode/test-web` Chromium                | 与桌面稳定版使用相同断言；不依赖 Node API                           |
| 外置 Mermaid | 兼容其 `engines.vscode` 的旧宿主           | 两主题槽位同步、关闭后恢复原值、图表不是代码块                      |
| 内置 Mermaid | VS Code 1.121+                             | 新内置 ID/能力被识别；Single/System 下图表亮暗与正文一致            |
| System 模式  | OS/浏览器亮暗、手动 VS Code 主题、高对比度 | 产品语义明确且两宿主一致；每次切换无需重启预览                      |
| KaTeX        | 长行与多行公式                             | 公式可读；页面只有一个主滚动区；无横向内容截断                      |

现有像素 parity 把 Mermaid、GeoJSON、STL 和数学标为 `integration-boundary`，且本地路径只保留源代码块，因此不能替代上述真实宿主测试。[Parity cases](../../../scripts/parity/cases.ts)、[平台边界测试](../../../tests/scripts/parity/platform-features.test.ts)

## 关键来源

- [VS Code：Markdown 扩展贡献点](https://code.visualstudio.com/api/extension-guides/markdown-extension)
- [VS Code：Web 扩展运行时与测试](https://code.visualstudio.com/api/extension-guides/web-extensions)
- [VS Code：Webview 当前主题信号](https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content)
- [VS Code 1.121：内置 Mermaid](https://code.visualstudio.com/updates/v1_121#_mermaid-diagrams-in-markdown-preview-and-notebooks)
- [VS Code 内置 Mermaid 清单，固定提交](https://github.com/microsoft/vscode/blob/bc2ac764ddd66802104366c182d490a03253f7e1/extensions/mermaid-markdown-features/package.json)
- [旧 `markdown-mermaid` 清单，固定提交](https://github.com/mjbvz/vscode-markdown-mermaid/blob/9f4d37ded0cc7fdf05bbab17fb082a6fc118e269/package.json)
- [GitHub：创建 Mermaid、GeoJSON、TopoJSON 与 STL 图表](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- [VS Code：内置 Markdown KaTeX](https://code.visualstudio.com/docs/languages/markdown#_math-formula-rendering)
- [历史 Mermaid 冲突 Issue #203](https://github.com/lzm0x219/vscode-github-markdown/issues/203)
- [历史 KaTeX 双滚动条 Issue #604](https://github.com/lzm0x219/vscode-github-markdown/issues/604)
