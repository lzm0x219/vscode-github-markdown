# Plan 001：v4 RFC 实施计划

## 状态

Draft

## 日期

2026-06-20

## 来源

- [RFC 001](../rfcs/0001-github-compatibility-scope-and-capability-matrix.md)：GitHub 兼容性范围与能力矩阵
- [RFC 002](../rfcs/0002-markdown-it-plugin-chain-and-layer-contracts.md)：`markdown-it` 插件链与层间契约
- [RFC 003](../rfcs/0003-github-theme-configuration-model.md)：GitHub 主题配置模型
- [RFC 004](../rfcs/0004-theme-command-surface-and-configuration-update-flow.md)：主题命令面与配置修改流程
- [RFC 005](../rfcs/0005-github-compatibility-verification-baseline.md)：GitHub 兼容性验证基线
- [RFC 006](../rfcs/0006-public-contract-evolution-policy.md)：用户可见配置与公开契约演进策略
- [ROADMAP](../ROADMAP.md)
- [ARCHITECTURE](../../ARCHITECTURE.md)

## 目标

把 v4 RFC 中已经确定的范围、契约、主题模型、命令面和验证要求，拆成可逐步实施、可验证、不会偏离 GitHub Markdown 兼容目标的任务。

## 执行原则

1. 已由 VS Code 内置 Markdown Preview 稳定提供的能力，默认复用，不重复实现。
2. 只有离线可确定、能缩小 GitHub 预览差距的能力，才进入 `extension-owned`。
3. 用户可见配置、命令、README 已支持能力、稳定 class 与 `data-*` 都按公开契约处理。
4. 每个新增或调整的公开能力，都必须同步考虑实现、README、RFC 和验证。
5. 运行时代码继续保持 Web Extension 兼容，不引入 Node-only 依赖。

## 当前基线

已具备：

- `markdown.markdownItPlugins`
- `markdown.previewScripts`
- `markdown.previewStyles`
- 任务列表、脚注、Alerts、Emoji 插件
- GitHub 主题配置项
- 主题根容器 `.vscode-github-markdown`
- `data-color-mode`、`data-light-theme`、`data-dark-theme`
- 配置变化后的 `markdown.preview.refresh`
- 四个主题命令已贡献并注册
- `scripts/verify-github-markdown.ts` 覆盖任务列表、脚注、Alerts、Emoji、Mermaid CSS

仍待实施：

- 主题根容器与主题元数据的固定验证
- 表格与代码块视觉对照
- 标题锚点行为确认
- README、RFC、实现、验证的发布前一致性检查

## Phase 1：固定现有公开契约

### Task 1.1：补齐主题结构验证

**说明：** 在现有最小验证脚本基础上，加入主题包装插件的输出断言，保护 `.vscode-github-markdown` 与三个主题 `data-*`。

**验收标准：**

- [ ] 验证覆盖 `.vscode-github-markdown`
- [ ] 验证覆盖 `data-color-mode`
- [ ] 验证覆盖 `data-light-theme`
- [ ] 验证覆盖 `data-dark-theme`
- [ ] 验证仍覆盖任务列表、脚注、Alerts

**验证：**

- [ ] `bun scripts/verify-github-markdown.ts`
- [ ] `pnpm run build`

**依赖：** 无

**可能涉及文件：**

- `scripts/verify-github-markdown.ts`
- `src/plugins/markdown-it-github-theme.ts`
- `src/theme.ts`

**规模：** Small

### Task 1.2：显式记录插件链契约

**说明：** 确认当前插件顺序为 `taskLists -> alerts -> footnotes -> theme`，并让验证或文档能及时暴露顺序误改。

**验收标准：**

- [ ] 插件顺序与 RFC 002 一致
- [ ] `theme` 仍作为最后一个包装插件
- [ ] 没有新增通用“大插件”吞并现有插件职责

**验证：**

- [ ] `pnpm run build`
- [ ] 人工检查 `src/extension.ts`

**依赖：** Task 1.1

**可能涉及文件：**

- `src/extension.ts`
- `scripts/verify-github-markdown.ts`

**规模：** XS

## Checkpoint：契约基线

- [ ] 现有已支持能力验证通过
- [ ] 主题结构验证通过
- [ ] README 中没有超前声明未实现能力

## Phase 2：实现主题命令面

### Task 2.1：贡献四个主题命令 ✅

**说明：** 在 `package.json` 中正式贡献 RFC 004 定义的四个主题命令，并复用已有本地化标题。已完成。

**验收标准：**

- [x] `vscode-github-markdown.changeThemeMode` 已贡献
- [x] `vscode-github-markdown.changeThemeSingle` 已贡献
- [x] `vscode-github-markdown.changeThemeSystemDay` 已贡献
- [x] `vscode-github-markdown.changeThemeSystemNight` 已贡献
- [x] 英文与中文本地化文案可用

**验证：**

- [ ] `pnpm run build`
- [ ] `pnpm exec vsce package --no-dependencies`

**依赖：** Checkpoint：契约基线

**可能涉及文件：**

- `package.json`
- `package.nls.json`
- `package.nls.zh-CN.json`

**规模：** Small

### Task 2.2：注册主题命令 ✅

**说明：** 在扩展激活时注册四个命令。命令只更新 RFC 003 中声明的四个公开配置项，不维护第二套主题状态。已完成。

**验收标准：**

- [x] 四个命令都通过 `vscode.commands.registerCommand` 注册
- [x] 每个命令只写入一个对应配置项
- [x] 用户取消选择时不写配置
- [x] 命令只允许写入 RFC 003 声明的合法值
- [x] 预览刷新继续依赖现有配置变化监听链路

**验证：**

- [ ] `pnpm run build`
- [ ] 手动执行四个命令并确认配置变更
- [ ] 手动确认 Markdown 预览刷新

**依赖：** Task 2.1

**可能涉及文件：**

- `src/extension.ts`
- `src/theme.ts`

**规模：** Medium

### Task 2.3：同步主题命令文档

**说明：** 当命令实现和验证完成后，再把“可通过 VS Code 命令修改主题配置”写入中英文 README。

**验收标准：**

- [ ] `README.md` 只声明已经实现的命令能力
- [ ] `README.zh-CN.md` 与英文文档语义对齐
- [ ] 命令名称、配置项名称与 manifest 一致

**验证：**

- [ ] 人工检查中英文 README
- [ ] `pnpm run build`

**依赖：** Task 2.2

**可能涉及文件：**

- `README.md`
- `README.zh-CN.md`

**规模：** Small

## Checkpoint：主题命令可用

- [x] 四个命令可在 VS Code 中执行
- [x] 主题配置写入后预览刷新
- [ ] README、RFC、实现、验证没有互相抢跑

## Phase 3：收紧可见 GitHub 兼容性

### Task 3.1：建立人工对照清单

**说明：** 为表格、代码块、标题、列表、引用块、Alerts 和脚注建立一份最小人工对照清单，作为发布前检查材料。

**验收标准：**

- [ ] 清单覆盖 RFC 005 中列出的高价值视觉差异
- [ ] 清单明确可接受差异与不可接受差异
- [ ] 清单不要求模拟 GitHub 在线上下文能力

**验证：**

- [ ] 人工走查清单内容

**依赖：** Checkpoint：主题命令可用

**可能涉及文件：**

- `docs/plans/0001-v4-rfc-implementation-plan.md`
- `docs/checklists/github-compatibility.md`

**规模：** Small

### Task 3.2：对齐表格与代码块视觉样式

**说明：** 基于人工对照结论，只调整属于 GitHub 一致性的表格与代码块样式。不新增主题系统，不重写 Markdown 解析。

**验收标准：**

- [ ] 表格边框、内边距和对齐更接近 GitHub
- [ ] 代码块间距、边框、背景和可读性更接近 GitHub
- [ ] 样式只作用于 `.vscode-github-markdown` 范围内
- [ ] 未改变 VS Code 内置解析结果

**验证：**

- [ ] `pnpm run build`
- [ ] 人工对照表格样例
- [ ] 人工对照代码块样例

**依赖：** Task 3.1

**可能涉及文件：**

- `src/extension.preview.css`
- `docs/checklists/github-compatibility.md`

**规模：** Medium

### Task 3.3：确认标题锚点行为

**说明：** 先判定 VS Code 内置行为与 GitHub 的差距是否值得补齐。只有确认属于离线可确定且高价值的差异后，才新增最小插件或预览行为。

**验收标准：**

- [ ] 记录 VS Code 当前标题锚点行为
- [ ] 记录 GitHub 目标行为
- [ ] 明确是否需要扩展实现
- [ ] 如果实现，必须补最小验证

**验证：**

- [ ] 人工对照标题锚点样例
- [ ] 如新增实现，运行对应验证脚本

**依赖：** Task 3.1

**可能涉及文件：**

- `docs/checklists/github-compatibility.md`
- `src/plugins/*`
- `scripts/verify-github-markdown.ts`

**规模：** Small 或 Medium

## Checkpoint：兼容性收敛

- [ ] 表格与代码块有明确对照结论
- [ ] 标题锚点有明确实现或不实现结论
- [ ] 所有新增公开支持项都有验证落点

## Phase 4：发布前一致性检查

### Task 4.1：执行公开契约一致性检查

**说明：** 按 RFC 006 检查 README、RFC、实现和验证是否一致，避免文档超前或实现暗改公开契约。

**验收标准：**

- [ ] README 已支持能力与当前实现一致
- [ ] README 已支持能力与验证范围一致
- [ ] 配置 key 与 RFC 003 一致
- [ ] 命令 id 与 RFC 004 一致
- [ ] 稳定 class 与 `data-*` 与 RFC 002、RFC 003 一致

**验证：**

- [ ] `pnpm run build`
- [ ] `bun scripts/verify-github-markdown.ts`
- [ ] `pnpm exec vsce package --no-dependencies`

**依赖：** Checkpoint：兼容性收敛

**可能涉及文件：**

- `README.md`
- `README.zh-CN.md`
- `docs/rfcs/*`
- `package.json`
- `src/*`
- `scripts/verify-github-markdown.ts`

**规模：** Medium

## 不纳入本计划

- GitHub API 集成
- `@mentions`
- Issue / Pull Request 引用
- 仓库上下文自动链接
- 资源上传流程
- 自定义 Markdown 预览系统
- 与 GitHub Markdown 兼容性无关的主题或配置扩张

## 风险

| 风险                     | 影响 | 处理方式                                            |
| ------------------------ | ---- | --------------------------------------------------- |
| README 超前声明能力      | High | 只有实现和验证都存在后，才写入已支持能力            |
| 主题命令绕开配置模型     | Med  | 命令只调用公开配置写入函数，不维护额外状态          |
| 视觉对齐变成大规模主题化 | Med  | 只改 `.vscode-github-markdown` 内的局部 GitHub 样式 |
| 锚点行为复杂度过高       | Med  | 先验证差异价值，不值得补齐就保留 VS Code 默认行为   |
| 验证脚本变重             | Low  | 继续用最小 fixture + assert，等脚本不够用再引入框架 |

## 开放问题

- 主题命令交互是否统一使用 Quick Pick？
- 人工对照清单是否需要纳入发布 checklist？
- 标题锚点行为是否真的比 VS Code 默认行为更值得补齐？
