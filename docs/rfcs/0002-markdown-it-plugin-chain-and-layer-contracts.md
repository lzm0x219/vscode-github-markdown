# RFC 002：`markdown-it` 插件链与层间契约

## 状态

Draft

## 日期

2026-06-20

## 背景

当前扩展的运行链路已经比较清晰：

- `src/extension.ts` 负责注册插件链
- `src/plugins/*` 负责 GitHub 特有但可离线确定的 Markdown 差异
- `src/plugins/markdown-it-github-theme.ts` 负责在最终输出外层包裹 GitHub 主题相关容器
- `src/extension.preview.css` 和 `src/extension.preview.ts` 负责最终呈现

现有插件链顺序是：

1. `taskLists`
2. `alerts`
3. `emoji`
4. `footnotes`
5. `theme`
6. `imageUrl`

这条链路已经能工作，但如果没有正式契约，后续新增能力时很容易出现这些问题：

- 新插件插入在错误位置，导致已有能力回归
- 插件层输出了不稳定的 HTML 结构，迫使预览层依赖脆弱 DOM
- 一个插件开始隐式依赖另一个插件的内部细节，后续难以维护
- 主题包装、语法增强、预览样式三层之间的责任边界变得模糊

这份 RFC 的目的，是把插件链、插件职责和层间稳定契约先固定下来。

## 目标

定义：

- 插件链的职责分层
- 插件注册顺序的规则
- 插件允许做什么，不允许做什么
- 插件层对预览层暴露的稳定结构

## 非目标

这份 RFC 不负责：

- 定义具体 GitHub 兼容性能力范围
- 定义主题配置模型
- 定义主题命令面
- 定义完整验证基线

这些内容分别由其他 RFC 承担。

## 决策

### 1. 插件链分为三类

扩展内的 `markdown-it` 插件统一分为三类：

1. 语法增强插件
2. 渲染包装插件
3. 渲染修正插件

#### 语法增强插件

职责：

- 处理 GitHub 特有但可离线确定的语义差异
- 修改 token 流或局部渲染输出
- 为预览层补充必要的 class、data attribute 或少量结构化 HTML

当前属于这一类的插件：

- `markdown-it-github-task-lists`
- `markdown-it-github-alerts`
- `markdown-it-github-emoji`
- `markdown-it-github-footnotes`

#### 渲染包装插件

职责：

- 不处理具体 Markdown 语义
- 在最终 HTML 输出外侧增加稳定容器或稳定元数据
- 为预览层提供统一作用域和主题相关信息

当前属于这一类的插件：

- `markdown-it-github-theme`

#### 渲染修正插件

职责：

- 不处理 Markdown 语义
- 不增加外层容器
- 在渲染阶段对已生成的 HTML 做局部修正
- 解决 webview 宿主环境与标准浏览器的差异

当前属于这一类的插件：

- `markdown-it-github-image-url`：将图片 `src` 中的绝对路径（`/path`）重写为相对路径（`./path`），使项目内绝对路径图片可在 VS Code webview 中正常加载。

### 2. 插件注册顺序属于稳定契约

扩展宿主层负责插件注册顺序，当前顺序定义为：

1. 所有语法增强插件
2. 所有渲染包装插件
3. 所有渲染修正插件

在当前代码中，这意味着：

1. `taskLists`
2. `alerts`
3. `emoji`
4. `footnotes`
5. `theme`
6. `imageUrl`

约束：

- 语法增强插件必须先于渲染包装插件执行
- `theme` 这类包装插件默认放在渲染修正插件之前
- 渲染修正插件放在链路最末尾，因为它们操作的是最终 HTML
- 任何新增包装型插件都不应插入语法增强插件之前

原因：

- 语法增强插件需要在最终输出包裹前完成 token 或局部 HTML 调整
- 预览层应始终依赖一个稳定的外层容器，而不是被多个插件重复包裹后的不确定结构
- 渲染修正插件需要在所有语义和包装处理完成后执行，避免其修正被后续插件覆盖或干扰

### 3. 一个插件只负责一个特性族

每个插件应只负责一个聚焦能力族，避免“万能插件”。

允许：

- 任务列表插件只处理任务列表
- 脚注插件只处理脚注
- Alerts 插件只处理 Alerts
- Emoji 插件只处理 emoji 短代码
- 主题插件只处理主题容器和主题元数据
- 图片路径插件只处理 webview 图片路径修正

不允许：

- 在同一个插件里同时处理多个不相关语法族
- 把主题行为和语法增强混在同一个插件里
- 用一个“通用 GitHub 插件”吞掉所有后续差异

### 4. 插件允许的修改范围

语法增强插件可以：

- 读取当前 token 流
- 修改局部 token 内容
- 添加必要的 class
- 添加必要的 `data-*` attribute
- 在确有必要时生成少量 `html_inline` 或 `html_block`

语法增强插件不应：

- 依赖网络
- 依赖仓库在线上下文
- 依赖 VS Code 全局可变状态
- 假设其它插件已经写入某个脆弱中间结构，除非该结构已被正式声明为稳定契约

渲染包装插件可以：

- 包裹最终 HTML
- 写入稳定的根容器
- 写入主题相关元数据

渲染包装插件不应：

- 重新解释 Markdown 语义
- 负责具体语法的补齐逻辑

渲染修正插件可以：

- 在渲染阶段修改已生成的 HTML token 内容
- 对特定标签的属性做正则替换（如 img src）
- 解决 webview 与标准浏览器之间的路径、协议等差异

渲染修正插件不应：

- 重新解释 Markdown 语义
- 添加或移除结构性 DOM 元素
- 依赖其他插件输出的脆弱中间格式

### 5. 插件层到预览层只暴露稳定结构

预览层只允许依赖以下稳定输出：

- 根容器 class
- 明确命名的 class
- 明确命名的 `data-*` attribute
- 少量已记录的稳定 HTML 结构

当前已知稳定输出包括：

- 根容器：`.vscode-github-markdown`
- 主题元数据：
  - `data-color-mode`
  - `data-light-theme`
  - `data-dark-theme`
- 任务列表相关 class：
  - `.contains-task-list`
  - `.task-list-item`
  - `.task-list-item-paragraph`
  - `.task-list-item-checkbox`
- Alerts 相关 class：
  - `.markdown-alert`
  - `.markdown-alert-*`
  - `.markdown-alert-body`
  - `.markdown-alert-title`
- Emoji 相关 class：
  - `.emoji`
- 脚注相关结构与 attribute：
  - `.footnotes`
  - `.footnote-ref`
  - `.footnote-backref`
  - `data-footnotes`
  - `data-footnote-ref`
  - `data-footnote-backref`

预览层不应依赖：

- 未在 RFC 或架构文档中声明的临时结构
- 特定 token 排列顺序在 HTML 中的偶然结果
- 未来可能被插件内部重构打破的脆弱嵌套关系

### 6. 跨插件共享只能通过稳定契约

插件之间默认不应隐式耦合。

允许：

- 多个插件遵守同一套命名规则
- 多个插件向预览层输出各自稳定的 class 或 `data-*`

不建议：

- 一个插件直接依赖另一个插件的内部局部实现
- 一个插件读取另一个插件未声明的临时状态

如果未来确实需要共享状态，应通过明确命名、可文档化的 `env` key 或等价稳定契约来完成。

### 7. 新插件的接入规则

后续新增 GitHub 兼容性功能时：

1. 先判断它是否属于 `built-in`、`extension-owned`、`out-of-scope`
2. 如果属于 `extension-owned`，优先新增聚焦插件，而不是扩张无关插件
3. 只有在新能力与现有插件属于同一特性族时，才允许扩展现有插件
4. 如果需要预览层配合，优先增加稳定 class 或 `data-*`，而不是引入脆弱 DOM 假设

## 对当前实现的解释

基于这份 RFC，当前实现可以理解为：

- `taskLists`、`alerts`、`emoji`、`footnotes` 是语法增强插件
- `theme` 是渲染包装插件
- `imageUrl` 是渲染修正插件
- `theme` 放在渲染修正插件之前是合理且应被保持的
- `imageUrl` 放在链路最末尾，操作的是最终 HTML
- 当前 `extension -> plugins -> preview` 的总体分层可以继续沿用

## 对后续工作的影响

这份 RFC 生效后：

- 新增兼容性能力时，必须先说明它要落在哪一层
- 预览层样式和脚本只能依赖这里声明的稳定结构
- 主题相关 RFC 应复用这里对包装插件的定义
- 验证基线 RFC 应覆盖插件顺序和稳定输出是否被破坏

## 开放问题

- 是否需要把稳定输出列表同步收敛到 `ARCHITECTURE.md`
- 脚注这类会追加 `html_block` 的插件，是否需要更细的输出规范
- 如果未来要加入标题锚点补齐，应该作为独立插件还是并入现有插件族
