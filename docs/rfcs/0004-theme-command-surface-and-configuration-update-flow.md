# RFC 004：主题命令面与配置修改流程

## 状态

Draft

## 日期

2026-06-20

## 背景

当前项目在主题命令相关能力上，已经有两部分基础：

- 本地化文案中已经存在四个主题命令标题
- 运行时已经存在主题配置写入函数与预览刷新机制

当前已存在的基础包括：

- `setThemeMode`
- `setThemeSingle`
- `setThemeSystemDay`
- `setThemeSystemNight`
- 当 `vscode-github-markdown` 配置变化时，触发 `markdown.preview.refresh`

但当前还缺少完整命令契约：

- `package.json` 还没有正式贡献这些 commands
- 运行时还没有注册这些 commands
- 还没有明确命令与配置项之间的一一映射
- 还没有定义命令执行后的统一刷新与失败语义

这份 RFC 的目标，就是把主题命令面和配置修改流程先固定下来。

## 目标

定义：

- 应暴露哪些 VS Code 命令
- 每个命令对应哪个主题配置项
- 命令如何更新配置
- 命令执行后如何触发预览刷新
- 命令失败时如何退化

## 非目标

这份 RFC 不负责：

- 定义主题配置模型本身
- 定义新增主题值集合
- 定义主题 UI 视觉设计
- 定义完整验证基线

这些内容由其他 RFC 单独承担。

## 决策

### 1. 主题命令面固定为四个命令

项目应暴露以下四个 VS Code 命令：

1. `vscode-github-markdown.changeThemeMode`
2. `vscode-github-markdown.changeThemeSingle`
3. `vscode-github-markdown.changeThemeSystemDay`
4. `vscode-github-markdown.changeThemeSystemNight`

它们分别对应四个公开主题配置项：

- `theme.mode`
- `theme.single`
- `theme.system.day`
- `theme.system.night`

命令职责必须保持单一，不应出现“一个命令同时修改多个配置项”的默认行为。

### 2. 命令与配置项保持一一映射

每个命令只负责一个配置项：

| 命令                                            | 配置项                                      | 作用                     |
| ----------------------------------------------- | ------------------------------------------- | ------------------------ |
| `vscode-github-markdown.changeThemeMode`        | `vscode-github-markdown.theme.mode`         | 修改主题模式             |
| `vscode-github-markdown.changeThemeSingle`      | `vscode-github-markdown.theme.single`       | 修改单主题模式下的主题   |
| `vscode-github-markdown.changeThemeSystemDay`   | `vscode-github-markdown.theme.system.day`   | 修改系统模式下的白天主题 |
| `vscode-github-markdown.changeThemeSystemNight` | `vscode-github-markdown.theme.system.night` | 修改系统模式下的夜间主题 |

这样做的目的很简单：

- 易于理解
- 易于测试
- 易于文档化
- 不把交互复杂度塞进配置层

### 3. 命令只修改公开配置，不引入额外状态

主题命令执行时，只允许通过公开配置项写入状态。

允许：

- 调用现有配置写入函数
- 使用 `vscode.workspace.getConfiguration(...).update(...)`

不允许：

- 引入额外的内存态主题状态
- 维护与配置项重复的命令态缓存
- 让预览层绕开配置项直接切换主题

也就是说，命令只是配置模型的交互入口，不是第二套状态系统。

### 4. 命令执行后依赖统一刷新链路

命令执行成功后，不直接操作预览 DOM。

标准流程应为：

1. 命令接收用户选择
2. 命令更新对应配置项
3. 配置变化触发 `onDidChangeConfiguration`
4. 执行 `markdown.preview.refresh`
5. 预览重新渲染并读取最新主题配置

约束：

- 刷新应复用已有配置变化监听链路
- 不为主题命令单独发明第二套刷新机制

### 5. 命令输入值必须受配置模型约束

命令只允许写入合法值。

对于 `theme.mode`：

- 只允许 `single`
- 只允许 `system`

对于三个主题选择命令：

- 只允许写入 `RFC 003` 中声明的合法主题集合

不允许：

- 命令写入未声明的主题值
- 命令绕过配置约束写入任意字符串

### 6. 命令可见性应与项目范围一致

这些命令属于用户可见功能，因此应：

- 在 `package.json` 中正式贡献
- 使用已有本地化标题
- 保持名称直接、清晰、无歧义

当前已知命令标题文案可以继续沿用：

- `GitHub Markdown: Change Theme Mode`
- `GitHub Markdown: Change Single Theme`
- `GitHub Markdown: Change Day Theme`
- `GitHub Markdown: Change Night Theme`

中文文案同理。

### 7. 失败语义保持保守

当命令执行失败时：

- 不修改预览 DOM
- 不留下与配置不一致的中间态
- 以配置更新结果为唯一真值来源

如果用户取消选择：

- 视为无操作
- 不刷新预览
- 不写入配置

如果配置写入失败：

- 当前主题状态保持不变
- 不应制造“看起来变了、实际没变”的假象

### 8. 命令面与配置模型解耦，但必须复用配置模型

这份 RFC 虽然定义命令面，但命令不能扩展配置模型本身。

这意味着：

- 新命令不能发明新的主题来源
- 新命令不能引入新的命令专属主题状态
- 所有命令行为都必须能映射回 `RFC 003` 的四个配置项

## 对当前实现的解释

基于这份 RFC，当前仓库可以理解为：

- `package.nls.json` 与 `package.nls.zh-CN.json` 已经提供了命令标题基础
- `src/theme.ts` 已经提供了配置读写函数基础
- `src/events.ts` 已经提供了配置变化后刷新预览的基础
- `src/commands.ts` 已经注册了四个主题命令，通过 Quick Pick 交互修改配置
- `package.json` 已经贡献了四个命令，命令 ID 与本节声明一致

## 对后续工作的影响

这份 RFC 生效后：

- 主题命令已经在 `package.json` 贡献并注册
- 命令名与已有本地化标题一致
- README 和设置文档可以把"支持通过 VS Code 命令修改主题配置"写成正式能力
- 验证基线 RFC 应覆盖命令修改配置后的预览一致性

## 开放问题

- 命令交互是否统一走 Quick Pick，还是某些命令使用其它输入方式
- 是否需要根据当前 `theme.mode` 动态隐藏不适用的主题命令
- 命令是否需要额外提供“重置为默认值”能力
