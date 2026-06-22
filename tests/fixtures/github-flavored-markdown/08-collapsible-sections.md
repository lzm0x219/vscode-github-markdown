# 八、折叠区块

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/08-collapsible-sections.md) 逐项对比。
>
> **索引：** [返回总清单](../github-flavored-markdown-checklist.md)

**基本折叠：**

<details>
<summary>点击展开详情</summary>

可包含 **格式**、列表、代码块：

- item 1
- item 2

```javascript
console.log("Hello from inside details!");
```

</details>

**带标题和内容的折叠：**

<details>
<summary>Tips for collapsed sections</summary>

### You can add a header

You can add text within a collapsed section.

```ruby
puts "Hello World"
```

</details>

**默认展开（`open` 属性）：**

<details open>
<summary>This section is open by default</summary>

Here is some content that is visible without clicking.

- item 1
- item 2

</details>

---
