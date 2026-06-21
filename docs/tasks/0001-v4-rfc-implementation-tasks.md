# Tasks 001：v4 RFC 实施任务

## 状态

Active

## 来源

- [Plan 001：v4 RFC 实施计划](../plans/0001-v4-rfc-implementation-plan.md)
- [ROADMAP](../ROADMAP.md)

## 执行顺序

1. 固定现有公开契约
2. 实现主题命令面
3. 收紧可见 GitHub 兼容性
4. 发布前一致性检查

## 当前基线

- Markdown Preview 已接入 `markdown.markdownItPlugins`、`markdown.previewScripts`、`markdown.previewStyles`
- 任务列表、脚注、Alerts、Emoji 插件已存在
- 主题包装插件已输出 `.vscode-github-markdown` 与主题 `data-*`
- 主题配置项已存在
- 主题命令已在 manifest 中贡献并在运行时注册
- 最小验证脚本已覆盖任务列表、脚注、Alerts、Emoji、Mermaid CSS

## Phase 1：固定现有公开契约

### Task 1.1：补齐主题结构验证

**状态：** Ready

**目标：** 在现有最小验证脚本中加入主题包装输出断言，保护 `.vscode-github-markdown` 与 `data-color-mode`、`data-light-theme`、`data-dark-theme`。

**验收标准：**

- [ ] 验证覆盖 `.vscode-github-markdown`
- [ ] 验证覆盖 `data-color-mode`
- [ ] 验证覆盖 `data-light-theme`
- [ ] 验证覆盖 `data-dark-theme`
- [ ] 任务列表、脚注、Alerts 验证仍通过

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

**状态：** Ready

**目标：** 固定当前 `taskLists -> alerts -> footnotes -> theme` 顺序，避免主题包装插件不再作为最后一层执行。

**验收标准：**

- [ ] 插件顺序与 RFC 002 一致
- [ ] `theme` 仍是最后一个包装插件
- [ ] 没有新增通用插件吞并现有插件职责

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

### Task 2.1：贡献四个主题命令

**状态：** Done

**目标：** 在 `package.json` 中贡献 RFC 004 定义的四个主题命令，并复用现有英文和中文本地化标题。

**验收标准：**

- [x] `vscode-github-markdown.changeThemeMode` 已贡献
- [x] `vscode-github-markdown.changeThemeSingle` 已贡献
- [x] `vscode-github-markdown.changeThemeSystemDay` 已贡献
- [x] `vscode-github-markdown.changeThemeSystemNight` 已贡献
- [x] 英文与中文本地化标题可用

**验证：**

- [ ] `pnpm run build`
- [ ] `pnpm exec vsce package --no-dependencies`

**依赖：** Checkpoint：契约基线

**可能涉及文件：**

- `package.json`
- `package.nls.json`
- `package.nls.zh-CN.json`

**规模：** Small

### Task 2.2：注册主题命令

**状态：** Done

**目标：** 在扩展激活时注册四个命令。命令只更新 RFC 003 中声明的公开配置项，不维护第二套主题状态。

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

**状态：** Blocked by Task 2.2

**目标：** 命令实现并验证后，再把通过 VS Code 命令修改主题配置的能力写入中英文 README。

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

**状态：** Blocked by 主题命令 checkpoint

**目标：** 为表格、代码块、标题、列表、引用块、Alerts 和脚注建立最小人工对照清单。

**验收标准：**

- [ ] 清单覆盖 RFC 005 中列出的高价值视觉差异
- [ ] 清单明确可接受差异与不可接受差异
- [ ] 清单不要求模拟 GitHub 在线上下文能力

**验证：**

- [ ] 人工走查清单内容

**依赖：** Checkpoint：主题命令可用

**可能涉及文件：**

- `docs/checklists/github-compatibility.md`

**规模：** Small

### Task 3.2：对齐表格与代码块视觉样式

**状态：** Blocked by Task 3.1

**目标：** 基于人工对照结论，只调整属于 GitHub 一致性的表格与代码块样式。

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

**状态：** Blocked by Task 3.1

**目标：** 先判定 VS Code 内置标题锚点行为与 GitHub 的差距是否值得补齐，再决定是否实现。

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

**状态：** Blocked by 兼容性收敛 checkpoint

**目标：** 按 RFC 006 检查 README、RFC、实现和验证是否一致，避免文档超前或实现暗改公开契约。

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
