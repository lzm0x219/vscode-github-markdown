# 历史反馈与高价值使用场景

## 结论摘要

- 最明确的高价值场景是：在 VS Code 内使用内置 Markdown 预览编写 README、项目文档和最终发布到 GitHub 的内容，并尽量避免推送后才发现差异。当前 Marketplace 只有一条带文字的评价支持这一场景，因此它是方向证据，不是高频需求证据。
- 历史外部用户 Issue 中，Mermaid 扩展冲突和 KaTeX 双滚动条是两个相关但不同的单例；它们共同提示伴生渲染边界值得验证，但不能合并为高频需求。v4.3 的最高优先级由当前已确认的 Mermaid 主题同步断点进一步支撑。
- HTML 图片根路径和 GitHub Alerts 各有一条外部用户报告，现有版本已经覆盖；应保留为回归样例，不应在没有新缺口证据时重新包装成版本功能。
- GitHub 语法、样式和主题一致性在 v1、v2、v4 规划及历次发布中反复出现，但主要是维护者信号。v4.2 应由当前覆盖矩阵选出仍未解决的高影响差异，不能从旧清单直接推导需求。
- 上游漂移检测、Web 宿主支持和长期可维护性目前缺少重复的外部用户反馈。它们适合作为保护已验证场景的工程约束，而不是宣称为用户主动要求的功能。

## 调研范围与证据分级

检索日期为 **2026-07-15**。本次检查了：

- 新路线图建立前的全部 41 个历史 GitHub Issue：35 个由维护者创建、4 个由外部用户创建、2 个由机器人创建。外部用户 Issue 是 [HTML 图片根路径](https://github.com/lzm0x219/vscode-github-markdown/issues/74)、[GitHub Alerts](https://github.com/lzm0x219/vscode-github-markdown/issues/197)、[Mermaid 扩展冲突](https://github.com/lzm0x219/vscode-github-markdown/issues/203)和 [KaTeX 双滚动条](https://github.com/lzm0x219/vscode-github-markdown/issues/604)。该快照可用 `gh issue list --state all --limit 500` 从[项目 Issue 列表](https://github.com/lzm0x219/vscode-github-markdown/issues?q=is%3Aissue)复核。
- [v1 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/2)、[v2 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/59)和 [v4 规划](https://github.com/lzm0x219/vscode-github-markdown/issues/298)。项目没有单独的 v3 路线图 Issue，因此以 [v3.0.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v3.0.0)和 [v3.1.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v3.1.0)发布记录补足。
- 当前 [README](https://github.com/lzm0x219/vscode-github-markdown/blob/main/README.md)、[CHANGELOG](https://github.com/lzm0x219/vscode-github-markdown/blob/main/CHANGELOG.md)和 GitHub Releases。
- Visual Studio Marketplace 的[当前扩展页面](https://marketplace.visualstudio.com/items?itemName=lzm0x219.vscode-github-markdown)、[当前扩展公开评价 API](https://marketplace.visualstudio.com/_apis/public/gallery/publishers/lzm0x219/extensions/vscode-github-markdown/reviews?api-version=7.2-preview.1)和[旧扩展公开评价 API](https://marketplace.visualstudio.com/_apis/public/gallery/publishers/lzm0x219/extensions/vscode-markdown-github/reviews?api-version=7.2-preview.1)。当前扩展只有一条带文字评价；旧扩展有两条仅评分评价，其中一名评价者与当前扩展评价者相同，不能重复计为独立证据。

本文使用以下分级，避免把维护者规划误写成用户需求：

| 分级           | 判定标准                                                           |
| -------------- | ------------------------------------------------------------------ |
| 高频用户证据   | 至少两名独立外部用户报告同一类需求；本样本很小，不代表整体用户分布 |
| 单例用户证据   | 一名外部用户的 Issue 或带文字公开评价                              |
| 维护者反复信号 | 同一方向至少出现在两个维护者拥有的路线图、发布记录或项目说明中     |
| 维护者假设     | 只有维护者单次规划或未验证 TODO 支持                               |

## 使用场景与证据矩阵

| 使用场景                                               | 证据与出现频率                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 影响                                                   | 现有覆盖                                                                                                                                                                          | 未解决问题                                                                                                                               | 版本对应                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 在本地编写 README 和项目文档，预览接近最终 GitHub 效果 | **单例用户 + 维护者反复信号。** 当前 Marketplace 的唯一文字评价明确提到 README、项目文档、最终发布到 GitHub 的内容，并认可内置预览工作流；[README](https://github.com/lzm0x219/vscode-github-markdown/blob/main/README.md#why-this-project)把减少推送后的渲染意外定义为项目目标；[v1 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/2)和 [v2 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/59)持续强调完整样式与主题一致性                                                                                                                          | 高：这是扩展存在的核心价值                             | 内置预览增强、GitHub 语法、九套主题及像素回归已覆盖                                                                                                                               | 没有尚未解决的具体用户报告；需由一致性覆盖矩阵确认当前高影响缺口                                                                         | **v4.2 主场景**；v4.4 保护其长期稳定性                                          |
| 与 Mermaid、KaTeX 等伴生渲染器共同工作，不破坏预览     | **两个相关的单例用户证据。** [Mermaid 扩展冲突](https://github.com/lzm0x219/vscode-github-markdown/issues/203)和 [KaTeX 双滚动条](https://github.com/lzm0x219/vscode-github-markdown/issues/604)来自两名独立用户，但故障类型不同；[v2 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/59)、[v3.1.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v3.1.0)、[v4.0.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v4.0.0)和 [v4.1.1](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v4.1.1)显示项目多次调整集成方式 | 高：冲突会使图表退化成代码块或导致预览不可用           | v4 不再内置 Mermaid，改为同步 `markdown-mermaid` 主题；README 声明对 Mermaid、GeoJSON、STL、数学等宿主渲染内容设置独立回归预算                                                    | 当前公开证据没有证明 Mermaid 与数学渲染在桌面端、Web 端及不同伴生扩展组合中都可靠；旧版“内置渲染”与 v4“伴生扩展”模型也未经过用户对比验证 | **v4.3 最高优先级候选**；v4.3 建立真实宿主回归，v4.4 将其接入持续探针与发布门禁 |
| GitHub 新语法或样式出现后，本地预览及时跟进            | **单例用户 + 维护者反复信号。** 用户通过 [Alerts 请求](https://github.com/lzm0x219/vscode-github-markdown/issues/197)要求跟进 GitHub 已支持的块引用语法；[v4 规划](https://github.com/lzm0x219/vscode-github-markdown/issues/298)再次要求同步块引用和标题样式；[v3.0.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v3.0.0)和 [v4.0.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v4.0.0)记录了交付                                                                                                                                               | 中高：语法不识别会直接造成 GitHub 与本地输出不同       | v4 已支持五类 GitHub Alerts；[CI](https://github.com/lzm0x219/vscode-github-markdown/blob/main/.github/workflows/ci.yml)执行本地像素基线，并定时检查远端 GitHub Markdown 渲染漂移 | 缺少对“GitHub 新能力发现—纳入样例—发布”的覆盖与时效证据；需结合上游漂移和一致性覆盖调研判断                                              | **v4.2** 处理已确认的语义/视觉缺口；**v4.4** 处理持续发现机制                   |
| 项目根路径形式的 HTML 图片在本地预览正常显示           | **单例用户证据。** [Issue #74](https://github.com/lzm0x219/vscode-github-markdown/issues/74)给出可复现失败；[v2.0.1](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v2.0.1)交付路径兼容；[v4.0.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v4.0.0)继续保留                                                                                                                                                                                                                                                                                         | 对使用根路径组织仓库文档的用户影响高，但证据只出现一次 | v4 会把 HTML `<img>` 的根路径改写为 Webview 可用路径                                                                                                                              | 当前无未解决报告；应验证并保留回归样例，不应默认需要新增功能                                                                             | **v4.2 回归基线**，除非覆盖矩阵发现新缺口                                       |
| 保留 VS Code 内置 Markdown 预览及其快速、原生工作流    | **单例用户 + 明确产品约束。** 当前 Marketplace 文字评价认可快速预览、与内置工作流无缝集成及不替换原生流程的方向；[README Quick Start](https://github.com/lzm0x219/vscode-github-markdown/blob/main/README.md#quick-start)明确不引入独立预览编辑器                                                                                                                                                                                                                                                                                                                                          | 高：替换工作流会改变产品定位并扩大兼容面               | v4 通过 VS Code 内置 Markdown 扩展钩子工作                                                                                                                                        | 伴生渲染器冲突说明“原生”不自动等于“可组合”；仍需跨扩展验证                                                                               | **v4.3 设计约束**，不是独立功能                                                 |
| 深色、浅色及无障碍主题下保持 GitHub 外观               | **维护者反复信号，缺少独立需求报告。** [v1 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/2)、[v2 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/59)、[v1.2.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v1.2.0)、[v2.0.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v2.0.0)和 v4 发布记录持续投入主题；当前文字评价只笼统认可样式，不能证明具体主题需求                                                                                                                                                 | 中高：视觉偏差直接损害核心承诺，但当前没有公开缺陷     | 九套 GitHub 主题、Single/System 模式、链接下划线和 Mermaid 主题同步已覆盖                                                                                                         | 没有公开用户报告指出具体主题缺口；不应仅凭历史投入扩展更多主题或配置                                                                     | **v4.4 回归保护**；只有发现具体差异时进入 v4.2                                  |
| 桌面端与 Web 扩展宿主行为一致                          | **维护者假设。** [v4 规划](https://github.com/lzm0x219/vscode-github-markdown/issues/298)要求 Web 扩展支持，[README](https://github.com/lzm0x219/vscode-github-markdown/blob/main/README.md#desktop-and-web)记录当前覆盖；未发现外部用户请求或缺陷                                                                                                                                                                                                                                                                                                                                         | 潜在影响高，但需求频率未知                             | 当前声明支持桌面端和 Web 端并执行宿主冒烟测试                                                                                                                                     | 尚无公开证据说明用户主要使用哪些 Web 场景，也没有具体跨宿主差异报告                                                                      | **v4.3 兼容性门槛**，不宜单独宣称为用户优先功能                                 |

## 证据不足或相互冲突的需求

1. **Mermaid 应内置还是由伴生扩展提供。** [Issue #203](https://github.com/lzm0x219/vscode-github-markdown/issues/203)最初报告与 `markdown-mermaid` 冲突，v3.1 通过内置 Mermaid 处理；[v4.0.0](https://github.com/lzm0x219/vscode-github-markdown/releases/tag/v4.0.0)又改为不内置渲染器。现有资料证明“不能互相破坏”，但不能证明用户偏好哪种交付模型。v4.3 应验证可组合性，不应重启架构争论，除非出现新证据。
2. **GeoJSON、TopoJSON、STL、数学表达式和代码块复制的优先级。** 它们来自 [v2 路线图](https://github.com/lzm0x219/vscode-github-markdown/issues/59)的维护者清单；除 KaTeX 布局缺陷外，没有独立用户需求证据。是否纳入后续版本应由当前 GitHub 能力覆盖和宿主边界决定。
3. **Emoji 自动补全和任务列表关联 Issue/PR。** [Emoji Issue](https://github.com/lzm0x219/vscode-github-markdown/issues/22)和[任务列表 Issue](https://github.com/lzm0x219/vscode-github-markdown/issues/21)保留了 TODO，但它们偏向编辑辅助或 GitHub 服务端上下文，且没有外部反馈，不应从旧 TODO 自动进入 v4.2–v4.4。
4. **Web 宿主、链接下划线与迁移体验。** 当前实现和发布记录覆盖这些方向，但没有公开用户报告能排序其后续投入。它们应作为兼容或回归约束，除非新的可复现问题改变证据等级。
5. **Marketplace 样本量不足。** 当前扩展只有一条文字评价；旧扩展两条评价均无文字，且其中一名评价者与当前扩展重合。评分可以证明满意度个例，不能用于推断功能频率或版本优先级。
6. **当前没有未解决的用户功能积压。** 除机器人依赖面板和本次 Wayfinder Ticket 外，没有开放的用户功能或缺陷 Issue；因此任何新功能承诺都需要覆盖矩阵、上游差异或新反馈支持。

## 对 v4.2–v4.4 的优先级建议

### v4.2：高影响 GitHub 渲染差异

1. 以“README/项目文档发布到 GitHub 前的本地预览”作为价值判断场景。
2. 由一致性覆盖矩阵选择仍然存在、可复现且影响该场景的差异；历史上已解决的 Alerts 和 HTML 图片路径只作为回归基线。
3. 不因 v1/v2 旧清单或单个未验证 TODO 承诺编辑辅助、服务端交互或新的客户端渲染器。

### v4.3：跨宿主与伴生渲染器兼容

1. 优先验证 Mermaid 与数学渲染边界：两类历史故障各有一个独立用户报告，且当前宿主调研已确认 Mermaid 主题同步断点。
2. 在桌面端和 Web 端检查内置预览、主题切换、长内容滚动及伴生扩展启停；保持“不自建预览系统”的已确认边界。
3. 对 GeoJSON、STL 等宿主渲染能力先验证责任边界，再决定是否需要项目实现 Ticket。

### v4.4：上游漂移与长期回归保障

1. 把主题、GitHub 新语法、HTML 图片路径及 v4.3 已建立的伴生渲染器用例接入持续探针与发布门禁，优先保护已有用户价值。
2. 将漂移检测表述为降低本地与 GitHub 再次分叉的风险，而不是声称存在高频用户请求。
3. 为后续反馈保留“宿主、伴生扩展、GitHub 示例、最小复现”字段，使新的单例能够被聚合为可判断的频率证据。

## 给其他调研 Ticket 的校正信号

- 一致性覆盖调研应优先回答核心 README/文档场景中的未解决差异，不要把“历史上做过”视为“当前仍有需求”。
- 跨宿主兼容调研应把 Mermaid 与数学渲染列为第一组组合测试；Web 支持本身只有维护者证据，应按风险验证而非按需求频率排序。
- 漂移与回归调研应覆盖 Alerts、HTML 图片根路径、主题和伴生渲染器边界；这些样例分别代表上游变化、宿主路径差异、视觉一致性和扩展组合风险。
- 最终版本汇总应保留证据等级。伴生渲染器只有两个不同故障类型的相关单例；其优先级还需要当前技术断点支撑，其他候选项同样需技术覆盖或新反馈补强。
