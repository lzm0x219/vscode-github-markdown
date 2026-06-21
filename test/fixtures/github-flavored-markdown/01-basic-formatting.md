# 一、基础排版

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/01-basic-formatting.md) 逐项对比。
>
> **索引：** [返回总清单](../github-flavored-markdown-checklist.md)

## 1.1 标题

# Heading level 1

## Heading level 2

### Heading level 3

#### Heading level 4

##### Heading level 5

###### Heading level 6

## 1.2 文本样式

| 样式       | 语法                     | 输出                                  |
| ---------- | ------------------------ | ------------------------------------- |
| 粗体       | `**text**` 或 `__text__` | **This is bold text**                 |
| 斜体       | `*text*` 或 `_text_`     | _This text is italicized_             |
| 删除线     | `~~text~~`               | ~~This was mistaken text~~            |
| 粗斜体嵌套 | `**text _text_**`        | **This is _extremely_ important**     |
| 全部粗斜体 | `***text***`             | **_All this text is important_**      |
| 下标       | `<sub>text</sub>`        | This is a <sub>subscript</sub> text   |
| 上标       | `<sup>text</sup>`        | This is a <sup>superscript</sup> text |
| 下划线     | `<ins>text</ins>`        | This is an <ins>underlined</ins> text |

## 1.3 段落与换行

段落通过空行分隔。

这是第一段。这段包含多个句子用来测试段落间距和行高是否符合 GitHub 的渲染风格。段落之间的空白行应该产生明显的分隔效果。

这是第二段。在 GitHub 上，段落之间的间距比行间距更大，这让文档更易于阅读。

**换行符（`.md` 文件中需要特殊处理）：**

双空格换行：
第二行（上一行末尾有两个空格）

反斜杠换行：\
第二行（上一行末尾有反斜杠）

`<br/>` 换行：<br/>第二行（上一行末尾有 `<br/>`）

## 1.4 分割线

三种写法效果相同：

---

---

---

## 1.5 转义与注释

**反斜杠转义：**

Let's rename \*our-new-project\* to \*our-old-project\*.

- \*这不是斜体\*
- \_这不是斜体\_
- \*\*这不是粗体\*\*
- \`这不是代码\`
- \# 这不是标题
- \- 这不是列表
- \> 这不是引用

**HTML 注释（隐藏内容）：**

<!-- This content will not appear in the rendered Markdown -->

<!--
多行注释
也不会显示
-->

## 1.6 特殊字符

- 版权符号：&copy; 2024
- 注册商标：&reg;
- 商标：&trade;
- 欧元符号：&euro;
- 破折号：&mdash; &ndash;
- 省略号：&hellip;
- 转义符：&amp; &lt; &gt; &quot; &apos;

---
