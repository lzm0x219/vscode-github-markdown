# Issue Tracker：GitHub

本仓库的 Issue 和产品需求文档（PRD）均存放在 GitHub Issues 中。所有操作使用 `gh` CLI 完成。

## 约定

- **创建 Issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取 Issue**：`gh issue view <number> --comments`，使用 `jq` 筛选评论并同时获取标签。
- **列出 Issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，并按需要添加 `--label` 和 `--state` 过滤条件。
- **评论 Issue**：`gh issue comment <number> --body "..."`
- **添加或移除标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭 Issue**：`gh issue close <number> --comment "..."`

仓库信息从 `git remote -v` 推断；在仓库克隆目录中运行时，`gh` 会自动完成此操作。

## 将 Pull Request 作为 Triage 入口

**PRs as a request surface: no.**（如果本仓库将外部 Pull Request 视为功能请求，可改为 `yes`；`/triage` 会读取此标志。）

设置为 `yes` 后，Pull Request 使用与 Issue 相同的标签和状态，并通过对应的 `gh pr` 命令操作：

- **读取 Pull Request**：使用 `gh pr view <number> --comments`，并通过 `gh pr diff <number>` 查看差异。
- **列出待分类的外部 Pull Request**：运行 `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，仅保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的条目，排除 `OWNER`、`MEMBER` 和 `COLLABORATOR`。
- **评论、添加标签或关闭**：使用 `gh pr comment`、`gh pr edit --add-label` / `--remove-label` 和 `gh pr close`。

GitHub 的 Issue 和 Pull Request 共用同一编号空间，因此裸编号 `#42` 可能指向任意一种对象。先运行 `gh pr view 42`，失败后再尝试 `gh issue view 42`。

## 技能要求“发布到 Issue Tracker”时

创建一个 GitHub Issue。

## 技能要求“获取相关 Ticket”时

运行 `gh issue view <number> --comments`。

## Wayfinder 操作

供 `/wayfinder` 使用。**地图**是一个 GitHub Issue，Ticket 是它的子 Issue。

- **地图**：创建带 `wayfinder:map` 标签的单个 Issue，正文保存备注、已完成决策和待探索区域。使用 `gh issue create --label wayfinder:map`。
- **子 Ticket**：通过 GitHub sub-issues API（`gh api`）将 Issue 关联为地图的子 Issue。如果仓库未启用 sub-issues，则在地图正文中使用任务列表，并在子 Issue 正文顶部添加 `Part of #<map>`。每个 Ticket 使用一个类型标签：`wayfinder:research`、`wayfinder:prototype`、`wayfinder:grilling` 或 `wayfinder:task`。Ticket 被认领后，需分配给当前推进地图的开发者。
- **阻塞关系**：优先使用 GitHub 原生 Issue Dependencies，使依赖关系在界面中可见。添加依赖边：`gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`。其中 `<blocker-db-id>` 是阻塞 Issue 的数字数据库 ID，通过 `gh api repos/<owner>/<repo>/issues/<n> --jq .id` 获取，不是 Issue 编号或 `node_id`。GitHub 通过 `issue_dependencies_summary.blocked_by` 报告仍开放的阻塞项。如果原生依赖不可用，则在子 Issue 正文顶部使用 `Blocked by: #<n>, #<n>`。当全部阻塞 Issue 关闭后，Ticket 才算解除阻塞。
- **前沿查询**：列出地图的所有开放子 Issue，排除仍有开放阻塞项或已有负责人者；地图顺序中的第一项即为下一张可认领 Ticket。
- **认领**：`gh issue edit <n> --add-assignee @me`。这是会话执行的第一个写操作。
- **解决**：先运行 `gh issue comment <n> --body "<answer>"` 记录答案，再关闭 Issue，最后将答案摘要与链接追加到地图的“已完成决策”中。
