# RFC 001：GitHub 兼容性范围与能力矩阵

## 状态

Draft

## 日期

2026-06-20

## 背景

这个项目的目标不是做一套“看起来像 GitHub”的 Markdown 主题，而是让 VS Code 中的 Markdown 预览尽可能接近 GitHub 的实际渲染行为与呈现效果。

当前代码与文档已经明确了几件事：

- 项目基于 VS Code 内置 Markdown Preview 扩展点实现
- 运行时保持 Web Extension 兼容
- GitHub 特有但可离线确定的差异，优先通过小型 `markdown-it` 插件或局部样式补齐
- 依赖在线或仓库上下文的 GitHub 能力，不做本地模拟

但是，“GitHub 兼容性”这个词目前仍然过宽。没有一份正式的能力矩阵，后续实现、文档和路线图很容易在这些问题上反复摇摆：

- 某个 Markdown 行为到底该由 VS Code 内置承担，还是由扩展补齐
- 某个差异是必须修复的兼容性缺口，还是可以接受的非目标
- 某个 GitHub 能力是不是离线可确定，是否值得进入实现范围

这份 RFC 的目的，就是把“支持什么、不支持什么、由谁负责、为什么这样划分”先固定下来。

## 目标

定义一份稳定的 GitHub Markdown 能力矩阵，用于指导：

- 路线图范围
- 后续功能实现
- 测试与验证基线
- README 与用户文档表述

## 非目标

这份 RFC 不负责：

- 定义具体插件实现细节
- 定义主题配置模型
- 定义 VS Code 主题命令面
- 定义完整验证流程

这些内容应由后续 RFC 单独承担。

## 决策

项目中的 Markdown 相关能力统一分为三类：

1. `built-in`
2. `extension-owned`
3. `out-of-scope`

### 1. `built-in`

定义：

由 VS Code 内置 Markdown Preview 已经稳定提供，且当前项目没有明确证据表明必须覆写其行为的能力。

处理原则：

- 默认直接复用
- 不重复实现
- 仅在存在明确 GitHub 一致性缺口时，才考虑升级为 `extension-owned`

当前典型范围：

- 普通段落、标题、列表的基础 Markdown 解析
- 常规链接与图片的基础渲染
- 标准 fenced code block 的基础解析
- 表格等 GFM 能力的基础解析能力

### 2. `extension-owned`

定义：

GitHub 与默认预览存在明确差异，且该差异可以只依赖本地 Markdown 内容或本地配置离线确定的能力。

处理原则：

- 优先使用最小 `markdown-it` 插件或局部样式补齐
- 必须保持 Web Extension 兼容
- 必须能说明为什么它属于 GitHub 一致性，而不是额外功能扩张

当前已知范围：

- 任务列表
- 脚注
- Alerts
- Emoji 短代码（`:rocket:` 等）
- Mermaid 图表 CSS 样式
- 图片绝对路径重写（`/path` → `./path`，适配 webview 预览）
- GitHub 主题模式与主题配置
- GitHub 主题相关的预览容器元数据注入

待进一步验证但属于本类候选的范围：

- 标题锚点生成与跳转行为
- 表格视觉细节对齐
- 代码块视觉细节对齐
- GitHub 风格留白、排版与块级样式

### 3. `out-of-scope`

定义：

依赖 GitHub 在线服务、仓库上下文、远程状态，或已经明显偏离当前项目边界的能力。

处理原则：

- 明确记录为不支持
- 不做半成品模拟
- 不因为个别场景诉求而绕开边界

当前明确不支持：

- `@mentions`
- Issue / Pull Request 引用
- 仓库上下文感知的自动链接
- 资源上传流程
- GitHub API 集成

## 能力矩阵

| 能力                          | 分类              | 当前状态    | 说明                                                              |
| ----------------------------- | ----------------- | ----------- | ----------------------------------------------------------------- |
| 基础 Markdown 渲染            | `built-in`        | Reuse       | 直接复用 VS Code 内置预览能力。                                   |
| 标题 / 段落 / 列表基础结构    | `built-in`        | Reuse       | 默认不重复实现，只在 GitHub 差异明显时补样式或局部行为。          |
| 任务列表                      | `extension-owned` | Implemented | 当前已有专门插件处理。                                            |
| 脚注                          | `extension-owned` | Implemented | 当前已有专门插件处理。                                            |
| Alerts                        | `extension-owned` | Implemented | 当前已有专门插件处理。                                            |
| Emoji 短代码                  | `extension-owned` | Implemented | 当前已有专门插件处理，覆盖 Unicode emoji 与 image emoji。         |
| Mermaid 图表 CSS 样式         | `extension-owned` | Implemented | 为 VS Code 内置 Mermaid 预览补齐默认主题样式。                    |
| 图片绝对路径重写              | `extension-owned` | Implemented | 将 `/path` 转为 `./path`，使绝对路径图片可在 webview 中正常显示。 |
| GitHub 主题模式与主题配置     | `extension-owned` | Implemented | 当前已有配置模型与主题相关元数据注入。                            |
| 通过 VS Code 命令修改主题配置 | `extension-owned` | Implemented | 四个主题命令已贡献并注册，通过 Quick Pick 交互。                  |
| 表格基础解析                  | `built-in`        | Reuse       | 当前默认依赖 VS Code 内置能力。                                   |
| 表格视觉对齐                  | `extension-owned` | Planned     | 属于 GitHub 一致性优化，而不是额外功能。                          |
| 代码块基础解析                | `built-in`        | Reuse       | 当前默认依赖内置能力。                                            |
| 代码块视觉对齐                | `extension-owned` | Planned     | 包括间距、边框、配色等 GitHub 风格细节。                          |
| 标题锚点行为                  | `extension-owned` | Planned     | 是否需要补齐，以验证结论为准。                                    |
| `@mentions`                   | `out-of-scope`    | Rejected    | 依赖 GitHub 在线上下文。                                          |
| Issue / PR 引用               | `out-of-scope`    | Rejected    | 依赖仓库上下文与在线解析。                                        |
| 仓库上下文自动链接            | `out-of-scope`    | Rejected    | 本地离线无法可靠确定。                                            |
| 资源上传                      | `out-of-scope`    | Rejected    | 超出当前项目目标。                                                |

## 纳入规则

一个新能力只有同时满足以下条件，才可以进入 `extension-owned`：

1. 它确实缩小了 VS Code 预览与 GitHub 结果之间的差距。
2. 它可以仅基于本地 Markdown 内容和本地配置离线确定。
3. 它可以通过现有扩展点以小改动实现。
4. 它能配套最小验证方式。

只满足“GitHub 有这个功能”，但不满足上面四条的能力，默认不纳入。

## 退化规则

当某项 GitHub 能力无法被可靠复现时：

- 保留 VS Code 标准预览行为
- 不输出具有误导性的 HTML
- 不做只在简单场景下看起来正确的半模拟实现

也就是说，保守地“不命中”优先于不可靠地“伪命中”。

## 对后续工作的影响

这份 RFC 生效后：

- `ROADMAP` 中的“GitHub 兼容性”应默认以这份能力矩阵为范围边界
- README 中对“已支持能力”的描述必须与这里保持一致
- 后续新增兼容性功能前，应先判断它属于 `built-in`、`extension-owned` 还是 `out-of-scope`
- 验证基线 RFC 应直接复用这里的能力分类

## 开放问题

- 标题锚点行为需要补到什么程度，才算“接近 GitHub”
- 表格与代码块的“视觉对齐”需要采用什么验证口径
- 主题命令面是否属于用户可见公开 API，以及如何版本化演进
