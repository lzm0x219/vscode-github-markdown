# GitHub Markdown 一致性覆盖矩阵

## 结论

当前仓库对既有扩展能力的视觉基线较完整：57 个校验用例中，53 个要求与 GitHub 截图精确一致，4 个把语法高亮和客户端渲染器明确作为集成边界；桌面最低版本、桌面稳定版和 Web 稳定版的宿主冒烟测试也已通过。但宿主冒烟仅覆盖主题容器、任务列表、NOTE 提示框、`:rocket:` 表情和 CSS 可达性，不能证明其余语法在真实 VS Code 桌面与 Web 宿主中的行为。

基于 GitHub 官方规范、GitHub Markdown API 的可复现输出和本地渲染链，v4.2 应只处理三个可验证候选：单波浪线删除线、GFM 禁用原始 HTML 标签、RTL 内容的 `dir="auto"`。三者均已确认 GitHub API 与仓库本地一致性渲染器存在差异；但真实 VS Code 桌面或 Web 宿主目前**没有已证实的新缺口**，必须先增加两端的 `markdown.api.render` 或最终 Webview DOM 断言，复现后才决定是否由扩展补齐，未复现则不实施。

图表、数学公式和语法高亮属于宿主或配套渲染器边界，放入 v4.3；漂移监控与基线治理放入 v4.4。GitHub 仓库上下文功能不应被误报为扩展缺陷。

## 证据方法与可信度

证据按以下顺序使用：

1. GitHub 官方文档与 [GFM 规范 0.29](https://github.github.com/gfm/) 定义目标语义。
2. [GitHub Markdown REST API](https://docs.github.com/en/rest/markdown/markdown) 的 `gfm` 模式用于最小输入复现。该 API 能确认 GitHub 服务端 HTML，但不能代表 GitHub 页面上的全部客户端增强。
3. 仓库源码、测试和校验产物用于确认扩展当前实现及覆盖范围。
4. 真实 VS Code 宿主测试优先于仓库的本地一致性渲染器。后者直接运行 MarkdownIt 和扩展插件，且截图禁用 JavaScript，因此只证明其声明范围内的静态视觉结果。

可信度定义：

- **已验证**：目标语义和当前行为均有可复现证据，或已在真实宿主断言。
- **局部验证**：静态视觉或少量宿主样例已覆盖，但语义、交互、平台或完整输入范围未覆盖。
- **未知**：没有足够证据判断桌面、Web 或 GitHub 页面行为；不得据此声称已支持或存在缺陷。

## 责任边界

| 层级                  | 负责内容                                                                                                  | 本项目应做什么                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| GitHub 服务与页面     | 仓库上下文解析、Issue/PR/提交引用、提及、自动链接规则、上传、颜色预览、任务状态交互、图表和数学等页面增强 | 作为目标或边界记录；没有可复现的本地预览等价物时不得伪造支持                                                |
| VS Code Markdown 宿主 | CommonMark/GFM 基础解析、预览 Webview、链接导航、语法高亮及扩展贡献点加载                                 | 优先通过内置 `markdown.markdownItPlugins`、`markdown.previewStyles` 和现有宿主行为集成；先在桌面与 Web 验证 |
| 本扩展                | 主题容器与样式、任务列表、提示框、表情、脚注、根路径 HTML 图片改写、Mermaid 主题同步                      | 只补齐宿主缺失且属于本地预览语义的高影响差异；保持 Web 扩展兼容，不引入自定义预览系统                       |
| 配套扩展              | Mermaid 等客户端渲染器                                                                                    | 本项目只维护明确的集成契约，不捆绑渲染器或把配套扩展结果当作本扩展实现                                      |

VS Code 官方文档说明，内置 Markdown 预览以 CommonMark 为基础，`markdown.previewStyles` 改变外观，`markdown.markdownItPlugins` 扩展语法，`markdown.previewScripts` 用于需要客户端脚本的高级渲染。本项目清单当前仅贡献 MarkdownIt 插件和预览样式，并同时声明桌面与 Web 入口；这决定了能力边界。[VS Code Markdown 扩展指南](https://code.visualstudio.com/api/extension-guides/markdown-extension)；[package.json](https://github.com/lzm0x219/vscode-github-markdown/blob/main/package.json)

## 覆盖矩阵

“桌面”和“Web”列只表示真实宿主证据，不用本地 Chromium 截图替代。

| 能力                                                     | GitHub 上游行为                                                                                                | 当前实现与责任方                                                                              | 桌面                       | Web                        | 证据与覆盖缺口                                                                                      | 用户影响                                                                       | 建议版本                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| 标题、段落、强调、引用、列表、链接、图片、行内与围栏代码 | GFM 继承 CommonMark，并增加页面属性和仓库上下文行为                                                            | 基础解析由 VS Code 宿主负责；扩展负责主题样式                                                 | 局部验证                   | 局部验证                   | 本地精确视觉用例覆盖常用静态输入；宿主冒烟未覆盖完整基础语法，锚点、相对导航和语义属性未知          | 高频；当前无已确认回归                                                         | 保持，缺口随具体复现进入 v4.2 或 v4.4 |
| GFM 表格                                                 | 支持表头、对齐和单元格内格式                                                                                   | VS Code 宿主解析，扩展样式                                                                    | 未知                       | 未知                       | 本地视觉精确一致；校验会归一化 GitHub 的无障碍表格包裹，因此未证明 DOM 等价                         | 高频；静态外观风险低，语义仍未知                                               | 保持；真实宿主断言纳入回归建设        |
| GFM 删除线（双波浪线）                                   | `~~文本~~` 生成 `<del>`                                                                                        | VS Code 宿主解析                                                                              | 未知                       | 未知                       | 本地视觉精确一致；没有真实宿主专项断言                                                              | 中频；当前无已确认回归                                                         | 保持                                  |
| GFM 删除线（单波浪线）                                   | GFM 允许一个或两个波浪线；GitHub API 将 `~文本~` 输出为 `<del>`                                                | 本地 MarkdownIt 保留原文；若真实宿主也缺失，应由扩展 MarkdownIt 插件补齐                      | 未知                       | 未知                       | 已确认 GitHub API 与本地渲染链差异；尚未运行桌面/Web `markdown.api.render` 最小复现                 | 中高频；预览会把有效 GitHub 格式误显示为普通文本                               | **v4.2 候选 1**                       |
| GFM 自动链接                                             | URL、`www` 地址和邮箱可自动链接；页面还可能添加属性                                                            | VS Code 宿主解析                                                                              | 未知                       | 未知                       | 本地语义链接已复现；GitHub 的 `rel`、`dir` 等属性及真实宿主导航未覆盖                               | 高频；基本语义已有，交互未知                                                   | 保持；不单独进入 v4.2                 |
| GFM 禁用原始 HTML 标签                                   | GFM tagfilter 转义 `title`、`textarea`、`style`、`xmp`、`iframe`、`noembed`、`noframes`、`script`、`plaintext` | 本地一致性渲染器会保留这些原始标签；真实 VS Code Webview 可能另有清理，责任须先按宿主结果判定 | 未知                       | 未知                       | GitHub API 与本地链差异已复现；截图只观察渲染结果，不能证明 Webview DOM 或清理阶段                  | 中频但差异明显；可能误导用户认为 GitHub 接受嵌入内容。当前证据不足以作安全结论 | **v4.2 候选 2，条件式**               |
| 普通原始 HTML、`details`、`picture`                      | GitHub 在清理规则允许范围内渲染 HTML；`details` 支持折叠区域                                                   | VS Code 宿主负责 HTML；扩展仅改写原始 HTML `<img src="/...">` 根路径                          | 未知                       | 未知                       | 本地静态视觉与图片改写单测有覆盖；交互、允许标签集、`srcset`、Markdown 图片根路径和真实宿主结果未知 | 中频；错误改写会造成资源预览偏差                                               | 不扩入 v4.2；先补证据                 |
| RTL 自动方向                                             | GitHub API 为阿拉伯语等标题和段落输出 `dir="auto"`                                                             | 本地 MarkdownIt 核心节点没有该属性；扩展生成的提示框含 `dir="auto"`，其余节点责任待宿主验证   | 未知                       | 未知                       | GitHub API 与本地链差异已复现；桌面/Web 对标题、段落、列表、脚注的结果未知                          | 对 RTL 用户为可访问性和混排方向问题                                            | **v4.2 候选 3，条件式**               |
| 任务列表                                                 | GitHub 显示复选框；Issue 中还可交互和跟踪任务                                                                  | 扩展插件生成禁用复选框、GitHub 类名和本地化无障碍标签；交互状态属于 GitHub 平台               | 已验证基本项               | 已验证基本项               | 本地视觉精确一致，桌面/Web 宿主冒烟覆盖一个基本项；嵌套、跨 Issue 跟踪和交互不属于当前宿主证据      | 高频；静态写作预览已覆盖                                                       | 保持；平台交互排除                    |
| 五类提示框                                               | GitHub 支持 NOTE、TIP、IMPORTANT、WARNING、CAUTION，且不支持嵌套                                               | 扩展 MarkdownIt 插件负责结构、图标和样式                                                      | 已验证 NOTE                | 已验证 NOTE                | 本地覆盖五类和多行内容；宿主只断言 NOTE，嵌套边界未形成宿主回归                                     | 高频文档能力；已有能力风险低                                                   | 保持；扩充宿主回归可进 v4.4           |
| GitHub 表情短代码                                        | GitHub 将受支持别名渲染为表情或自定义图像；编辑器补全属于平台                                                  | 扩展用生成的别名表负责渲染                                                                    | 已验证 `:rocket:`          | 已验证 `:rocket:`          | 本地覆盖表情语料；宿主只覆盖一个别名，别名更新与自定义图像加载范围未全面验证                        | 高频；当前无已确认功能缺口                                                     | 保持；漂移治理进 v4.4                 |
| 脚注                                                     | GitHub 支持脚注引用、定义和反向链接                                                                            | 扩展插件负责渲染                                                                              | 未知                       | 未知                       | 本地视觉和单元测试覆盖连续定义及简单多行定义；真实宿主、键盘导航、复杂嵌套未知                      | 中频；现有静态结果可信，宿主风险未量化                                         | 保持；先补宿主断言                    |
| 主题、浅深色与链接下划线                                 | GitHub 外观随主题变化                                                                                          | 扩展主题容器和 CSS 负责九个主题、系统模式及下划线选项                                         | CSS 可达性已验证；视觉未知 | CSS 可达性已验证；视觉未知 | 主主题有广泛视觉语料；其余主题只覆盖简单格式。宿主冒烟只验证样式文件存在和容器输出                  | 高频；属于扩展核心，但无具体已确认差异                                         | 不凭空扩充 v4.2；后续以具体复现驱动   |
| 代码语法高亮                                             | GitHub 根据语言标识高亮围栏代码                                                                                | VS Code 宿主负责高亮，扩展映射 GitHub 主题颜色                                                | 未知                       | 未知                       | 当前作为视觉集成边界，允许约 2.12 万差异像素；本地对照会归一化 token，不能证明高亮引擎一致          | 高频；版本和主题变化敏感                                                       | **v4.3**                              |
| Mermaid                                                  | GitHub 页面客户端渲染 Mermaid                                                                                  | `bierner.markdown-mermaid` 负责渲染；本扩展只同步其主题设置并在卸载时恢复                     | 未知                       | 未知                       | 当前截图禁用 JavaScript，平台语料仅作为高阈值集成边界；没有配套扩展的桌面/Web 端到端证据            | 中高频；边界清晰但兼容性未知                                                   | **v4.3**                              |
| GeoJSON、TopoJSON、STL                                   | GitHub 页面客户端渲染地图和 3D 模型                                                                            | VS Code 宿主或配套扩展责任；本扩展未实现渲染器                                                | 未知                       | 未知                       | 当前只保留源代码块并纳入高阈值边界，不能宣称与 GitHub 等价                                          | 低至中频；实现成本和 Web 风险高                                                | v4.3 调研或明确不支持                 |
| 数学公式                                                 | GitHub 使用 MathJax 支持行内、块级和 `math` 围栏                                                               | VS Code 宿主或配套扩展责任；本扩展未实现渲染器                                                | 未知                       | 未知                       | 当前截图禁用 JavaScript，平台语料不能证明数学渲染                                                   | 中频；若捆绑渲染器会显著扩大范围                                               | v4.3 调研或明确不支持                 |
| 提及、Issue/PR/提交引用、关闭关键字、自定义自动链接      | GitHub 依赖仓库、用户、权限和服务端上下文解析                                                                  | GitHub 平台责任；本地预览无可靠等价上下文                                                     | 不适用                     | 不适用                     | GitHub API `context` 只能覆盖部分引用，无法复制完整页面行为                                         | 用户可见但不属于扩展可独立实现的 Markdown 语义                                 | 排除 v4.2；文档说明边界               |
| 上传附件、颜色预览、标题大纲、锚点 UI、交互式任务        | GitHub 编辑器或页面功能                                                                                        | GitHub 平台责任                                                                               | 不适用                     | 不适用                     | 不属于静态 Markdown 渲染；当前仓库没有实现声明                                                      | 用户可见但错误实现会制造虚假一致性                                             | 明确不实现，除非未来建立独立产品目标  |

## v4.2 缺口排序与执行建议

### 1. 补齐单波浪线删除线语义一致性

这是证据最完整、范围最小的候选。GFM 规范明确允许一个或两个波浪线，GitHub API 可稳定复现 `<del>`，而当前本地渲染链保留字面文本。

执行条件与验收：

- 先为 VS Code 1.74 桌面、桌面稳定版和 Web 稳定版增加 `markdown.api.render('~文本~')` 断言。
- 仅当宿主未生成 `<del>` 时，在现有 MarkdownIt 插件链中增加最小兼容实现；不得改变双波浪线、代码跨度和转义波浪线行为。
- 增加 GitHub API 基准 fixture、DOM 语义断言和精确视觉用例；未知输入必须保持字面文本，而不是宽松吞并。

### 2. 对齐 GFM 禁用原始 HTML 标签

GitHub API 与本地链的差异已经确认，但实际 VS Code 预览 Webview 可能在后续阶段处理原始 HTML，因此该项只能作为条件式 v4.2 工作。

执行条件与验收：

- 在桌面最低版本、桌面稳定版与 Web 稳定版分别断言九类 tagfilter 标签的最终预览 DOM，而不只检查 MarkdownIt 中间 HTML。
- 若宿主最终结果与 GitHub 不同，修复必须只影响 GFM 指定的九类标签，并保留普通允许 HTML、`details`、`picture` 和现有图片改写。
- 把该项表述为渲染一致性，不在没有威胁路径证据时宣称安全漏洞。

### 3. 对齐 RTL 内容自动方向

GitHub API 对 RTL 标题和段落输出 `dir="auto"`，当前本地链缺失。该差异影响可访问性和双向文本布局，但责任仍需由真实宿主结果决定。

执行条件与验收：

- 在桌面与 Web 宿主覆盖阿拉伯语及中英混排的标题、段落、列表、提示框和脚注。
- 比较最终 DOM 的 `dir` 语义与视觉方向；避免把 `dir="auto"` 重复或错误添加到代码节点。
- 若需扩展处理，只修改扩展可控节点或通过最小 MarkdownIt core 规则补齐，不引入自定义预览。

## v4.2 明确排除

- 不实现或捆绑 Mermaid、GeoJSON、TopoJSON、STL、MathJax、语法高亮引擎；这些属于 v4.3 的宿主与配套渲染器兼容性工作。
- 不实现提及、Issue/PR/提交引用、关闭关键字、自定义自动链接、上传、颜色预览、标题大纲或交互式任务；这些依赖 GitHub 服务和页面上下文。
- 不新增 `markdown.previewScripts` 或自定义预览系统来绕过 VS Code 内置宿主。
- 不在没有具体复现的情况下扩充主题、设置或重写已有提示框、表情、脚注、任务列表和图片逻辑。
- 不把基线刷新、上游漂移监控或长期回归框架塞入 v4.2；这些属于 v4.4。

## 未知项与取证路径

1. **三个 v4.2 候选的真实宿主结果**：扩展 `tests/host/smoke.ts`，在 VS Code 1.74 桌面、桌面稳定版和 Web 稳定版检查 `markdown.api.render` 与最终 Webview DOM。中间 MarkdownIt HTML不能替代最终结果。
2. **客户端渲染器**：为 Mermaid 等配套扩展建立单独的桌面/Web 集成测试，启用 JavaScript，并记录配套扩展版本。当前禁用 JavaScript 的 Chromium 截图不能回答此问题。
3. **资源 URL 行为**：在已提交 fixture 中覆盖 Markdown 图片、原始 HTML `img`、`picture`/`source srcset`、相对路径和根路径，并在真实工作区预览验证桌面/Web。未取证前不扩大图片重写范围。
4. **九个主题的广度**：目前附加主题只覆盖简单格式；后续应按用户证据选择高风险构造，而不是机械复制整个主主题语料。
5. **链接、锚点和脚注交互**：用宿主 UI 测试检查点击、键盘焦点和返回导航，或在产品边界中明确不保证。截图零差异不证明交互。
6. **GitHub 上下文差异**：同一 Markdown 在仓库文件、Issue、PR、讨论和 Wiki 中可能得到不同增强。任何新增承诺都要记录目标表面，并用对应官方页面或 API 复现。

## 仓库证据

- 扩展入口及插件链：[src/extension.ts](https://github.com/lzm0x219/vscode-github-markdown/blob/main/src/extension.ts)
- 任务列表、提示框、表情、脚注、主题和图片改写：[src/plugins](https://github.com/lzm0x219/vscode-github-markdown/tree/main/src/plugins)
- 一致性用例与边界声明：[scripts/parity/cases.ts](https://github.com/lzm0x219/vscode-github-markdown/blob/main/scripts/parity/cases.ts)
- Chromium 截图禁用 JavaScript：[scripts/parity/browser.ts](https://github.com/lzm0x219/vscode-github-markdown/blob/main/scripts/parity/browser.ts)
- 真实宿主冒烟范围：[tests/host/smoke.ts](https://github.com/lzm0x219/vscode-github-markdown/blob/main/tests/host/smoke.ts)
- 桌面最低版、桌面稳定版和 Web 稳定版矩阵：[.github/workflows/ci.yml](https://github.com/lzm0x219/vscode-github-markdown/blob/main/.github/workflows/ci.yml)
- 最近一次三类宿主任务均成功的主分支运行：[GitHub Actions 运行 29394603420](https://github.com/lzm0x219/vscode-github-markdown/actions/runs/29394603420)

## 上游资料

- [GitHub 基本写作与格式语法](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [GitHub 表格](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables)
- [GitHub 折叠区域](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections)
- [GitHub 代码块与语法高亮](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks)
- [GitHub 图表](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- [GitHub 数学表达式](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions)
- [GitHub 自动链接引用与 URL](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls)
