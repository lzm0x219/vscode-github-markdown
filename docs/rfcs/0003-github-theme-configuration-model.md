# RFC 003：GitHub 主题配置模型

## 状态

Draft

## 日期

2026-06-20

## 背景

当前项目已经具备 GitHub 主题相关的基础能力：

- 用户可以通过配置选择主题模式
- 支持单主题模式和系统跟随模式
- 支持单独设置白天主题与夜间主题
- 预览层会在根容器上写入主题相关 `data-*` attribute
- 配置变化后会触发 `markdown.preview.refresh`

但目前这些能力仍然只是代码和 manifest 中的分散事实，还没有一份正式文档回答下面这些问题：

- `single` 和 `system` 两种模式的正式语义是什么
- 哪些配置项属于公开契约
- 各配置项的默认值和合法值是什么
- 预览层应该依赖哪些稳定的主题元数据
- 配置变化后，哪些预览行为必须同步更新

这份 RFC 的目标，就是把 GitHub 主题配置模型先固定下来。

## 目标

定义：

- 主题模式的正式语义
- 主题配置项的正式集合
- 主题值的合法集合
- 预览层可依赖的稳定主题元数据
- 配置变化与预览刷新的关系

## 非目标

这份 RFC 不负责：

- 定义通过 VS Code 命令修改配置的交互流程
- 定义新增主题的命名或选型策略
- 定义 GitHub 兼容性能力范围
- 定义验证基线

这些内容由其他 RFC 单独承担。

## 决策

### 1. 公开配置项固定为四个

GitHub 主题配置模型当前固定为以下四个用户可见配置项：

1. `vscode-github-markdown.theme.mode`
2. `vscode-github-markdown.theme.single`
3. `vscode-github-markdown.theme.system.day`
4. `vscode-github-markdown.theme.system.night`

它们都属于公开契约。

含义：

- `theme.mode`：决定当前使用单主题模式还是系统跟随模式
- `theme.single`：单主题模式下使用的主题
- `theme.system.day`：系统模式下白天使用的主题
- `theme.system.night`：系统模式下夜间使用的主题

新增主题相关配置项应被视为公开 API 变更，不应随意添加。

### 2. 主题模式只有两种

`theme.mode` 的合法值固定为：

- `single`
- `system`

语义：

- `single`：始终使用一个固定主题
- `system`：根据系统昼夜状态，在白天主题和夜间主题之间切换

默认值：

- `system`

### 3. 主题值集合固定为当前声明集合

当前合法主题值固定为以下集合：

- `light`
- `light_colorblind`
- `light_high_contrast`
- `light_tritanopia`
- `dark`
- `dark_colorblind`
- `dark_dimmed`
- `dark_high_contrast`
- `dark_tritanopia`

默认值：

- `theme.single = light`
- `theme.system.day = light`
- `theme.system.night = dark`

约束：

- 所有主题配置项都只能从这个合法集合中取值
- 预览层不应假设存在集合之外的主题

### 4. 预览层主题元数据固定为三个 `data-*` attribute

预览层根容器必须稳定输出以下主题元数据：

- `data-color-mode`
- `data-light-theme`
- `data-dark-theme`

根容器固定为：

- `.vscode-github-markdown`

语义：

- `data-color-mode`
  - `light`
  - `dark`
  - `auto`
- `data-light-theme`
  - 表示当前白天主题配置值
- `data-dark-theme`
  - 表示当前夜间主题配置值

当前约定下：

- 当 `theme.mode = single` 时：
  - `data-color-mode` 根据 `theme.single` 推导为 `light` 或 `dark`
  - `data-light-theme` 仍然来自 `theme.system.day`
  - `data-dark-theme` 仍然来自 `theme.system.night`
- 当 `theme.mode = system` 时：
  - `data-color-mode = auto`
  - `data-light-theme` 来自 `theme.system.day`
  - `data-dark-theme` 来自 `theme.system.night`

这个模型的重点是：

- `data-color-mode` 表达当前模式语义
- `data-light-theme` / `data-dark-theme` 表达主题选择语义

### 5. 单主题模式与系统模式的正式行为

#### 单主题模式

当 `theme.mode = single` 时：

- 预览应表现为固定主题
- `theme.single` 决定当前视觉类型是亮色还是暗色
- 系统昼夜变化不应改变预览主题

#### 系统模式

当 `theme.mode = system` 时：

- 预览应遵循系统昼夜语义
- `theme.system.day` 负责白天主题
- `theme.system.night` 负责夜间主题
- 系统昼夜变化可以改变预览主题

### 6. 配置变化必须触发预览刷新

当 `vscode-github-markdown` 命名空间下的主题配置发生变化时：

- 扩展必须触发 `markdown.preview.refresh`
- 预览中的主题相关 `data-*` attribute 必须重新计算
- 预览样式必须在下一次渲染中反映最新配置

这属于稳定行为，而不是可选优化。

### 7. 主题模型与命令面解耦

这份 RFC 只定义配置模型，不定义命令交互。

也就是说：

- 命令是否存在，不影响配置模型本身成立
- 后续主题命令 RFC 只能操作这四个配置项
- 主题命令 RFC 不应发明新的主题状态来源

## 对当前实现的解释

基于这份 RFC，当前实现可以理解为：

- `src/theme.ts` 是主题配置模型的运行时访问层
- `package.json` 中的 `contributes.configuration` 是用户可见契约声明
- `src/plugins/markdown-it-github-theme.ts` 负责把配置映射为稳定的根容器与主题元数据
- `src/events.ts` 负责在配置变化后刷新预览

## 对后续工作的影响

这份 RFC 生效后：

- 主题命令 RFC 必须围绕这四个配置项设计
- 预览层样式只能依赖这里声明的根容器和主题元数据
- 新增主题值时，必须同时修改配置契约、运行时类型和预览层依赖
- README 或设置说明中的主题描述必须与这里保持一致

## 开放问题

- 未来如果引入更多 GitHub 主题变体，是否继续沿用当前平面命名集合
- `single` 模式下是否需要让 `data-light-theme` / `data-dark-theme` 也反映单主题值，而不是继续反映系统配置
- 主题配置变化是否需要更细粒度刷新，而不只是统一调用 `markdown.preview.refresh`
