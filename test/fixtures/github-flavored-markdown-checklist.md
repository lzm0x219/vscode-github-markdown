# GitHub Flavored Markdown — 兼容性验证清单

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown-checklist.md) 逐项对比。
>
> **参考文档：**
>
> - [基本写作和格式语法](https://docs.github.com/zh/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
> - [使用高级格式](https://docs.github.com/zh/get-started/writing-on-github/working-with-advanced-formatting)

## 功能清单

- [一、基础排版](#一基础排版)
- [二、链接与引用](#二链接与引用)
- [三、代码与颜色](#三代码与颜色)
- [四、列表](#四列表)
- [五、表格](#五表格)
- [六、引用与 Alerts](#六引用与-alerts)
- [七、图片与媒体](#七图片与媒体)
- [八、折叠区块](#八折叠区块)
- [九、表情符号](#九表情符号)
- [十、脚注](#十脚注)
- [十一、GitHub 专属功能](#十一github-专属功能)
- [十二、HTML 元素](#十二html-元素)

---

## 数据验证矩阵

> 以下注释用于自动化验证——每行对应一个需检测的渲染产物。

<!-- TASK_LIST: verify class="contains-task-list" and checkbox inputs -->
<!-- FOOTNOTES: verify class="footnote-ref", class="footnote-backref", section.footnotes -->
<!-- ALERTS: verify class="markdown-alert" and alert type classes -->
<!-- HEADINGS: verify h1-h6 rendering and heading anchors -->
<!-- CODE_BLOCKS: verify fenced code blocks with language identifiers -->
<!-- TABLES: verify table alignment classes -->
<!-- EMOJI: verify emoji shortcode rendering -->
<!-- STRIKETHROUGH: verify ~~ del tag rendering -->
<!-- ESCAPING: verify backslash escaping behavior -->
<!-- DETAILS: verify <details>/<summary> HTML rendering -->
<!-- MERMAID: verify mermaid diagram language support -->
<!-- MATH: verify LaTeX math expression rendering -->
<!-- AUTOLINK: verify URL auto-linking behavior -->
<!-- KEYWORDS: verify closes/fixes/resolves keyword behavior -->

---

## 一、基础排版

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/01-basic-formatting.md) 逐项对比。

### 1.1 标题

# Heading level 1

## Heading level 2

### Heading level 3

#### Heading level 4

##### Heading level 5

###### Heading level 6

### 1.2 文本样式

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

### 1.3 段落与换行

段落通过空行分隔。

这是第一段。这段包含多个句子用来测试段落间距和行高是否符合 GitHub 的渲染风格。段落之间的空白行应该产生明显的分隔效果。

这是第二段。在 GitHub 上，段落之间的间距比行间距更大，这让文档更易于阅读。

**换行符（`.md` 文件中需要特殊处理）：**

双空格换行：
第二行（上一行末尾有两个空格）

反斜杠换行：\
第二行（上一行末尾有反斜杠）

`<br/>` 换行：<br/>第二行（上一行末尾有 `<br/>`）

### 1.4 分割线

三种写法效果相同：

---

---

---

### 1.5 转义与注释

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

### 1.6 特殊字符

- 版权符号：&copy; 2024
- 注册商标：&reg;
- 商标：&trade;
- 欧元符号：&euro;
- 破折号：&mdash; &ndash;
- 省略号：&hellip;
- 转义符：&amp; &lt; &gt; &quot; &apos;

---

## 二、链接与引用

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/02-links-and-references.md) 逐项对比。

### 2.1 链接

**内联链接：** [GitHub Pages](https://pages.github.com/)

**自动链接：** https://github.com

**带标题的链接：** [GitHub](https://github.com "Visit GitHub")

**相对链接：**

- [返回 README](../../README.md)
- [贡献指南](../../CONTRIBUTING.md)

### 2.2 章节链接与定位点

**章节链接：** 跳转到 [1.1 标题](#11-标题) | [五、表格](#五表格) | [十、脚注](#十脚注)

**自定义定位点：**

<a name="my-custom-anchor-point"></a>

这段文字没有自己的标题，但可以通过自定义定位点直接链接到它。

[跳转到自定义定位点](#my-custom-anchor-point)

### 2.3 自动链接引用

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

### 2.4 提及与关键字

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

## 三、代码与颜色

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/03-code-and-color.md) 逐项对比。

### 3.1 行内代码与代码块

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

### 3.2 语法高亮

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

### 3.3 颜色模型

> **注意：** 颜色可视化仅在 GitHub Issues/PR/Discussions 中受支持。

- 十六进制：`#0969DA` `#ffffff` `#000000`
- RGB：`rgb(9, 105, 218)` `rgb(255, 255, 255)`
- HSL：`hsl(212, 92%, 45%)` `hsl(0, 0%, 100%)`

---

## 四、列表

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/04-lists.md) 逐项对比。

### 4.1 无序与有序列表

**无序列表（`-` `*` `+` 等效）：**

- George Washington

* John Adams

- Thomas Jefferson

**有序列表：**

1. James Madison
2. James Monroe
3. John Quincy Adams

**嵌套列表：**

1. First list item
   - First nested list item
     - Second nested list item
       - Third nested list item

2. First list item
   - First nested list item
     - Second nested list item

**混合嵌套：**

1. 第一步
   - 子任务 A
     1. 子子任务 1
     2. 子子任务 2
   - 子任务 B
2. 第二步
   > 列表中的引用
   >
   > 第二行引用

### 4.2 任务列表

- [x] #739
- [ ] https://github.com/octo-org/octo-repo/issues/740
- [ ] Add delight to the experience when all tasks are complete :tada:
- [x] 已完成的任务项
- [ ] 未完成的任务项
- [ ] \(Optional) Open a followup issue

> 任务列表项说明以括号开头时，需用 `\` 转义。

---

## 五、表格

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/05-tables.md) 逐项对比。

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

## 六、引用与 Alerts

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/06-quotes-and-alerts.md) 逐项对比。

### 6.1 引用文本

单行引用：

> Text that is a quote

多行引用：

> This is a multi-line
> blockquote that spans
> several lines.

嵌套引用：

> Level one
>
> > Level two
> >
> > > Level three

### 6.2 Alerts

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.

**多行 Alerts：**

> [!NOTE]
> 这是第一行。
> 这是第二行。
>
> 这是新段落，中间有空行。

---

## 七、图片与媒体

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/07-images-and-media.md) 逐项对比。

**外部图片：**

![Screenshot of a comment on a GitHub issue showing an image of an Octocat smiling and raising a tentacle.](https://placehold.co/600x400/0366d6/FFFFFF/png?text=Octocat+Example)

**相对路径图片：**

| 上下文                  | 相对链接                                             |
| ----------------------- | ---------------------------------------------------- |
| 同一 `.md` 分支上的文件 | `/assets/images/electrocat.png`                      |
| 另一 `.md` 分支上的文件 | `/../main/assets/images/electrocat.png`              |
| Issues/PR/评论中        | `../blob/main/assets/images/electrocat.png?raw=true` |

**`<picture>` 元素：**

<picture>
  <source srcset="https://placehold.co/800x400/png?text=WebP" type="image/webp">
  <img src="https://placehold.co/800x400/png?text=Fallback" alt="Picture element test">
</picture>

---

## 八、折叠区块

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/08-collapsible-sections.md) 逐项对比。

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

## 九、表情符号

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/09-emoji.md) 逐项对比。

@octocat :+1: This PR looks great - it's ready to merge! :shipit:

| 表情       | 代码         |     | 表情    | 代码      |
| ---------- | ------------ | --- | ------- | --------- |
| :smile:    | `:smile:`    |     | :heart: | `:heart:` |
| :rocket:   | `:rocket:`   |     | :tada:  | `:tada:`  |
| :warning:  | `:warning:`  |     | :bulb:  | `:bulb:`  |
| :memo:     | `:memo:`     |     | :bug:   | `:bug:`   |
| :sparkles: | `:sparkles:` |     | :fire:  | `:fire:`  |

---

## 十、脚注

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/10-footnotes.md) 逐项对比。

Here is a simple footnote[^1].

A footnote can also have multiple lines[^2].

脚注中可使用 Markdown 格式[^3]。

同一个脚注可以被多次引用[^1]。

[^1]: My reference.

[^2]:
    To add line breaks within a footnote, add 2 spaces to the end of a line.
    This is a second line.

[^3]: 脚注中可以包含 **粗体**、_斜体_、`代码` 甚至 [链接](https://github.com)。

> **注意：** 脚注定义的位置不影响渲染位置——始终呈现在文档底部。Wiki 不支持脚注。

---

## 十一、GitHub 专属功能

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/11-github-platform-features.md) 逐项对比。
>
> **注意：** 以下功能依赖 GitHub 平台特定实现，VS Code 本地预览中可能不会渲染。

### 11.1 Mermaid 图表

> Mermaid 支持的全部图表类型。

#### 1. Flowchart（流程图）

```mermaid
flowchart TD
    Start([开始]) --> Input[/输入数据/]
    Input --> Check{校验通过?}
    Check -->|是| Process[处理]
    Check -->|否| Error[报错]
    Process --> Output[/输出结果/]
    Error --> End([结束])
    Output --> End
```

#### 2. Sequence Diagram（序列图）

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant D as 数据库

    U->>F: 提交表单
    F->>B: POST /api/data
    activate B
    B->>D: INSERT INTO ...
    activate D
    D-->>B: OK
    deactivate D
    B-->>F: 201 Created
    deactivate B
    F-->>U: 成功提示
```

#### 3. Class Diagram（类图）

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +String breed
        +fetch() void
    }
    class Cat {
        +String color
        +purr() void
    }
    Animal <|-- Dog
    Animal <|-- Cat
    class Owner {
        +String name
        +feed(Animal) void
    }
    Owner --> Animal : owns
```

#### 4. State Diagram（状态图）

```mermaid
stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已支付 : 付款成功
    待支付 --> 已取消 : 超时/取消
    已支付 --> 配送中 : 发货
    配送中 --> 已完成 : 签收
    已完成 --> [*]
    已取消 --> [*]
```

#### 5. Entity Relationship Diagram（实体关系图）

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    CUSTOMER {
        int id PK
        string name
        string email UK
    }
    ORDER {
        int id PK
        date created_at
        string status
    }
    LINE_ITEM {
        int order_id FK
        int product_id FK
        int quantity
    }
    PRODUCT {
        int id PK
        string name
        float price
    }
```

#### 6. User Journey（用户旅程图）

```mermaid
journey
    title 网购用户旅程
    section 浏览商品
      进入首页: 3: 用户
      搜索商品: 4: 用户
      查看详情: 5: 用户
    section 下单
      加入购物车: 5: 用户
      填写地址: 3: 用户
      支付: 2: 用户, 支付网关
    section 收货
      收到通知: 4: 用户
      确认收货: 5: 用户
```

#### 7. Gantt（甘特图）

```mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    axisFormat  %m/%d

    section 需求阶段
    需求调研           :done, req1, 2025-01-06, 3d
    需求评审           :done, req2, after req1, 2d

    section 开发阶段
    API 开发            :active, dev1, after req2, 5d
    前端开发            :dev2, after req2, 5d
    联调测试            :dev3, after dev1, 3d

    section 上线
    灰度发布            :milestone, m1, after dev3, 0d
    全量上线            :deploy, after m1, 1d
```

#### 8. Pie Chart（饼图）

```mermaid
pie showData
    title 编程语言使用分布
    "JavaScript" : 42.5
    "Python" : 28.1
    "TypeScript" : 18.3
    "Go" : 6.7
    "其他" : 4.4
```

#### 9. Quadrant Chart（象限图）

```mermaid
quadrantChart
    title 技术选型象限
    x-axis "低复杂性" --> "高复杂性"
    y-axis "低收益" --> "高收益"
    quadrant-1 "优先采用"
    quadrant-2 "谨慎评估"
    quadrant-3 "暂不考虑"
    quadrant-4 "快速尝试"
    React: [0.6, 0.8]
    Vue: [0.5, 0.7]
    Svelte: [0.4, 0.6]
    Angular: [0.8, 0.5]
    jQuery: [0.2, 0.2]
```

#### 10. Requirement Diagram（需求图）

```mermaid
  requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
```

#### 11. Git Graph（Git 图）

```mermaid
gitGraph
    commit id: "初始提交"
    commit id: "添加 README"
    branch feature/login
    checkout feature/login
    commit id: "实现登录"
    commit id: "添加测试"
    checkout main
    merge feature/login tag: "v1.0.0"
    commit id: "修复 bug"
    branch hotfix/crash
    checkout hotfix/crash
    commit id: "修复崩溃"
    checkout main
    merge hotfix/crash tag: "v1.0.1"
```

#### 12. C4 Diagram（C4 图）

```mermaid
C4Context
    title 系统上下文图 - 网购平台

    Person(customer, "顾客", "通过浏览器访问")
    System(shop, "商城系统", "处理订单和支付")
    System_Ext(payment, "支付网关", "第三方支付")
    System_Ext(email, "邮件服务", "发送通知")

    Rel(customer, shop, "浏览、下单")
    Rel(shop, payment, "调用支付")
    Rel(shop, email, "发送邮件")
    Rel(payment, shop, "回调通知")
```

#### 13. Mindmap（思维导图）

```mermaid
mindmap
  root((VS Code 插件))
    功能
      Markdown 预览
      语法高亮
      代码补全
      代码片段
    技术栈
      TypeScript
      VS Code API
      Node.js
    发布
      VS Code Marketplace
      Open VSX
      GitHub Releases
```

#### 14. Timeline（时间线）

```mermaid
timeline
    title 项目里程碑
    2024 Q1 : 项目启动 : 需求调研 : 技术选型
    2024 Q2 : MVP 开发 : 内部测试
    2024 Q3 : 公开 Beta : 收集反馈
    2024 Q4 : 正式发布 v1.0 : 市场推广
    2025 Q1 : 功能迭代 : 性能优化
```

#### 15. Sankey（桑基图）

```mermaid
sankey

%% source,target,value
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
```

#### 16. XY Chart（XY 图）

```mermaid
xychart
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
```

#### 17. Block Diagram（框图）

```mermaid
block
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
```

#### 18. Packet（网络数据包图 — 仅限文字渲染）

```mermaid
packet-beta
    title TCP 数据包结构
    0-15: "源端口 (16 bits)"
    16-31: "目的端口 (16 bits)"
    32-63: "序列号 (32 bits)"
    64-95: "确认号 (32 bits)"
    96-99: "数据偏移"
    100-105: "保留"
    106-106: "URG"
    107-107: "ACK"
    108-108: "PSH"
    109-109: "RST"
    110-110: "SYN"
    111-111: "FIN"
    112-127: "窗口大小 (16 bits)"
    128-143: "校验和 (16 bits)"
    144-159: "紧急指针 (16 bits)"
    160-191: "选项 (可变)"
    192-255: "数据"
```

### 11.2 GeoJSON / TopoJSON 地图

```geojson
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "ID": 0
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -90,
              35
            ],
            [
              -90,
              30
            ],
            [
              -85,
              30
            ],
            [
              -85,
              35
            ],
            [
              -90,
              35
            ]
          ]
        ]
      }
    }
  ]
}
```

```topojson
{
  "type": "Topology",
  "transform": {
    "scale": [
      0.0005000500050005,
      0.00010001000100010001
    ],
    "translate": [
      100,
      0
    ]
  },
  "objects": {
    "example": {
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Point",
          "properties": {
            "prop0": "value0"
          },
          "coordinates": [
            4000,
            5000
          ]
        },
        {
          "type": "LineString",
          "properties": {
            "prop0": "value0"
          },
          "arcs": [
            0
          ]
        },
        {
          "type": "Polygon",
          "properties": {
            "prop0": "value0"
          },
          "arcs": [
            [
              1
            ]
          ]
        }
      ]
    }
  },
  "arcs": [
    [
      [
        4000,
        0
      ],
      [
        1999,
        9999
      ],
      [
        2000,
        -9999
      ],
      [
        2000,
        9999
      ]
    ],
    [
      [
        0,
        0
      ],
      [
        0,
        9999
      ],
      [
        2000,
        0
      ],
      [
        0,
        -9999
      ],
      [
        -2000,
        0
      ]
    ]
  ]
}
```

### 11.3 STL 3D 模型

```stl
solid cube_corner
  facet normal 0.0 -1.0 0.0
    outer loop
      vertex 0.0 0.0 0.0
      vertex 1.0 0.0 0.0
      vertex 0.0 0.0 1.0
    endloop
  endfacet
  facet normal 0.0 0.0 -1.0
    outer loop
      vertex 0.0 0.0 0.0
      vertex 0.0 1.0 0.0
      vertex 1.0 0.0 0.0
    endloop
  endfacet
  facet normal -1.0 0.0 0.0
    outer loop
      vertex 0.0 0.0 0.0
      vertex 0.0 0.0 1.0
      vertex 0.0 1.0 0.0
    endloop
  endfacet
  facet normal 0.577 0.577 0.577
    outer loop
      vertex 1.0 0.0 0.0
      vertex 0.0 1.0 0.0
      vertex 0.0 0.0 1.0
    endloop
  endfacet
endsolid cube_corner
```

---

## 十二、HTML 元素

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/12-html-elements.md) 逐项对比。

**`<kbd>` 键盘按键：**

按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制，按 <kbd>Command</kbd> + <kbd>V</kbd> 粘贴。

---
