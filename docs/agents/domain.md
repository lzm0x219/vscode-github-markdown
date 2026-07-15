# 领域文档

工程技能探索代码库时，应按本文件约定读取和使用领域文档。

## 探索前读取

- 仓库根目录的 **`CONTEXT.md`**；或
- 根目录的 **`CONTEXT-MAP.md`**（如果存在）。该文件指向各上下文对应的 `CONTEXT.md`，只读取与当前任务相关的部分。
- **`docs/adr/`** 中与当前工作区域相关的 ADR。多上下文仓库还需检查 `src/<context>/docs/adr/` 中的上下文级决策。

如果这些文件不存在，直接继续，不要报告缺失，也不要建议预先创建。`/domain-modeling` 技能会在术语或决策真正确定后按需创建它们。

## 文件结构

单一上下文仓库（默认）：

```text
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录存在 `CONTEXT-MAP.md`）：

```text
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文级决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表中的词汇

当输出内容需要命名领域概念，例如 Issue 标题、重构提案、假设或测试名称时，使用 `CONTEXT.md` 中定义的术语，不要改用术语表明确排除的同义词。

如果所需概念尚未出现在术语表中，这通常意味着使用了项目中不存在的语言，或领域模型确实存在缺口。前者应重新考虑措辞，后者应记录并交由 `/domain-modeling` 处理。

## 标记 ADR 冲突

如果输出与现有 ADR 冲突，必须明确指出，而不是静默覆盖：

> 与 ADR-0007（事件溯源订单）冲突，但值得重新讨论，因为……
