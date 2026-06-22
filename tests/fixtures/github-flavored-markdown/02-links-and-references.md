# 二、链接与引用

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/02-links-and-references.md) 逐项对比。
>
> **索引：** [返回总清单](../github-flavored-markdown-checklist.md)

## 2.1 链接

**内联链接：** [GitHub Pages](https://pages.github.com/)

**自动链接：** https://github.com

**带标题的链接：** [GitHub](https://github.com "Visit GitHub")

**相对链接：**

- [返回 README](../../../README.md)
- [贡献指南](../../../CONTRIBUTING.md)

## 2.2 章节链接与定位点

**章节链接：** 跳转到 [1.1 标题](./01-basic-formatting.md#11-标题) | [五、表格](./05-tables.md#五表格) | [十、脚注](./10-footnotes.md#十脚注)

**自定义定位点：**

<a name="my-custom-anchor-point"></a>

这段文字没有自己的标题，但可以通过自定义定位点直接链接到它。

[跳转到自定义定位点](#my-custom-anchor-point)

## 2.3 自动链接引用

> **注意：** 以下功能仅在 GitHub Issues/PR/Discussions 中生效，`.md` 文件预览通常不生效。

**URL 自动链接：** Visit https://github.com

**Issue/PR 引用格式：**

| 引用类型            | 语法                                             |
| ------------------- | ------------------------------------------------ |
| Issue/PR URL        | `https://github.com/jlord/sheetsee.js/issues/26` |
| `#` + 编号          | `#26`                                            |
| `GH-` + 编号        | `GH-26`                                          |
| `User/Repo#` + 编号 | `jlord/sheetsee.js#26`                           |
| `Org/Repo#` + 编号  | `github-linguist/linguist#4039`                  |

**提交 SHA 引用：**

| 引用类型        | 语法                                                         |
| --------------- | ------------------------------------------------------------ |
| 提交 URL        | `https://github.com/jlord/sheetsee.js/commit/a5c3785`        |
| 完整 SHA        | `a5c3785ed8d6a35868bc169f07e40e889087fd2e`                   |
| `User@SHA`      | `jlord@a5c3785ed8d6a35868bc169f07e40e889087fd2e`             |
| `User/Repo@SHA` | `jlord/sheetsee.js@a5c3785ed8d6a35868bc169f07e40e889087fd2e` |

## 2.4 提及与关键字

> **注意：** 以下功能仅在 GitHub Issues/PR 中生效。

**@提及：** @github/support What do you think about these updates?

**Issue/PR 编号引用：** #1、#42

**关键字链接：**

| 关键字                        | 效果             |
| ----------------------------- | ---------------- |
| close / closes / closed       | 链接并关闭 Issue |
| fix / fixes / fixed           | 链接并关闭 Issue |
| resolve / resolves / resolved | 链接并关闭 Issue |
| Duplicate of #N               | 标记为重复       |

- `Closes #10` — 合并时自动关闭 Issue
- `Fixes octo-org/octo-repo#100`
- `Resolves #42`
- `Duplicate of #26` — 将当前 Issue/PR 标记为重复

---
