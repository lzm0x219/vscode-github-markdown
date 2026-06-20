# RFC 列表

这份文档只回答一件事：基于当前 [ROADMAP](../ROADMAP.md)、[ARCHITECTURE](../../ARCHITECTURE.md)、`README` 与现有代码，接下来应该优先写哪些 RFC。

## 已有 RFC

| 编号                                                                     | 标题                           | 状态  |
| ------------------------------------------------------------------------ | ------------------------------ | ----- |
| [RFC 001](./0001-github-compatibility-scope-and-capability-matrix.md)    | GitHub 兼容性范围与能力矩阵    | Draft |
| [RFC 002](./0002-markdown-it-plugin-chain-and-layer-contracts.md)        | `markdown-it` 插件链与层间契约 | Draft |
| [RFC 003](./0003-github-theme-configuration-model.md)                    | GitHub 主题配置模型            | Draft |
| [RFC 004](./0004-theme-command-surface-and-configuration-update-flow.md) | 主题命令面与配置修改流程       | Draft |
| [RFC 005](./0005-github-compatibility-verification-baseline.md)          | GitHub 兼容性验证基线          | Draft |
| [RFC 006](./0006-public-contract-evolution-policy.md)                    | 用户可见配置与公开契约演进策略 | Draft |

## 候选 RFC

## 暂缓主题

下面这些方向现在不建议立 RFC，至少不应排在上面几篇之前：

- Mermaid / 数学公式 / 图表支持
- 任何导出、发布、静态站点生成相关主题
- GitHub API 集成
- 仓库上下文感知能力
- 与 GitHub 一致性无直接关系的额外主题系统

原因很简单：当前文档已经把项目边界收得很紧，这些主题要么超前，要么不在项目范围内。

## 推荐顺序

1. [RFC 001](./0001-github-compatibility-scope-and-capability-matrix.md)：先把支持范围说清楚。
2. [RFC 002](./0002-markdown-it-plugin-chain-and-layer-contracts.md)：再把插件边界和层间契约固定下来。
3. [RFC 003](./0003-github-theme-configuration-model.md)：然后明确主题配置模型。
4. [RFC 004](./0004-theme-command-surface-and-configuration-update-flow.md)：再定义主题命令面。
5. [RFC 005](./0005-github-compatibility-verification-baseline.md)：最后把验证基线收敛成固定流程。
6. [RFC 006](./0006-public-contract-evolution-policy.md)：最后明确公开契约如何演进。
