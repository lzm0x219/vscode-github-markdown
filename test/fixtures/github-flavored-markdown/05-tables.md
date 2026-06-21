# 五、表格

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/05-tables.md) 逐项对比。
>
> **索引：** [返回总清单](../github-flavored-markdown-checklist.md)

**基本表格：**

| Left-aligned | Center-aligned |  Right-aligned |
| :----------- | :------------: | -------------: |
| `git status` |  _git status_  | **git status** |
| `git diff`   |   _git diff_   |   ~~git diff~~ |

**内联格式与样式：**

| 功能                       | 语法          | 状态 |
| -------------------------- | ------------- | ---- |
| **粗体**                   | `**text**`    | 支持 |
| _斜体_                     | `_text_`      | 支持 |
| `代码`                     | `` `code` ``  | 支持 |
| [链接](https://github.com) | `[text](url)` | 支持 |

**管道符 `|` 在单元格内需转义：**

| Name     | Character |
| -------- | --------- |
| Backtick | `         |
| Pipe     | \|        |

**表格前必须有空行才能正确渲染：**

| Command      | Description                                        |
| ------------ | -------------------------------------------------- |
| `git status` | List all _new or modified_ files                   |
| `git diff`   | Show file differences that **haven't been** staged |

---
