# 三、代码与颜色

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/03-code-and-color.md) 逐项对比。
>
> **索引：** [返回总清单](../github-flavored-markdown-checklist.md)

## 3.1 行内代码与代码块

**行内代码：** Use `git status` to list all new or modified files.

**无语言标识的代码块：**

```
git status
git add .
git commit -m "Initial commit"
```

**在代码块内显示反引号（四重反引号包裹）：**

````text
```
Look! You can see my backticks.
```
````

## 3.2 语法高亮

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

```python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

```ruby
require 'redcarpet'
markdown = Redcarpet.new("Hello World!")
puts markdown.to_html
```

```css
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 16px;
}
```

```json
{ "name": "vscode-github-markdown", "version": "4.0.0" }
```

```yaml
on:
  push:
    branches: [main]
```

```diff
- const oldValue = "deprecated";
+ const newValue = "current";
```

```bash
#!/bin/bash
echo "Hello from bash"
```

## 3.3 颜色模型

> **注意：** 颜色可视化仅在 GitHub Issues/PR/Discussions 中受支持。

- 十六进制：`#0969DA` `#ffffff` `#000000`
- RGB：`rgb(9, 105, 218)` `rgb(255, 255, 255)`
- HSL：`hsl(212, 92%, 45%)` `hsl(0, 0%, 100%)`

---
