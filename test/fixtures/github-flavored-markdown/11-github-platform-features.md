# 十一、GitHub 专属功能

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/11-github-platform-features.md) 逐项对比。
>
> **索引：** [返回总清单](../github-flavored-markdown-checklist.md)

> **注意：** 以下功能依赖 GitHub 平台特定实现，VS Code 本地预览中可能不会渲染。

## 11.1 Mermaid 图表

> Mermaid 支持的全部图表类型。

### 1. Flowchart（流程图）

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

### 2. Sequence Diagram（序列图）

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

### 3. Class Diagram（类图）

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

### 4. State Diagram（状态图）

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

### 5. Entity Relationship Diagram（实体关系图）

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

### 6. User Journey（用户旅程图）

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

### 7. Gantt（甘特图）

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

### 8. Pie Chart（饼图）

```mermaid
pie showData
    title 编程语言使用分布
    "JavaScript" : 42.5
    "Python" : 28.1
    "TypeScript" : 18.3
    "Go" : 6.7
    "其他" : 4.4
```

### 9. Quadrant Chart（象限图）

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

### 10. Requirement Diagram（需求图）

```mermaid
requirementDiagram
    requirement 用户登录 {
        id: REQ-001
        text: 用户可以使用邮箱和密码登录
        risk: low
        verifymethod: test
    }
    requirement 密码加密 {
        id: REQ-002
        text: 密码必须使用 bcrypt 加密存储
        risk: high
        verifymethod: inspection
    }
    requirement 会话管理 {
        id: REQ-003
        text: 登录后生成 JWT token
        risk: medium
        verifymethod: test
    }

    element 登录模块 {
        type: module
    }
    element 认证服务 {
        type: module
    }

    用户登录 - contains -> 密码加密
    用户登录 - contains -> 会话管理
    登录模块 - satisfies -> 用户登录
    认证服务 - satisfies -> 密码加密
    认证服务 - satisfies -> 会话管理
```

### 11. Git Graph（Git 图）

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

### 12. C4 Diagram（C4 图）

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

### 13. Mindmap（思维导图）

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

### 14. Timeline（时间线）

```mermaid
timeline
    title 项目里程碑
    2024 Q1 : 项目启动 : 需求调研 : 技术选型
    2024 Q2 : MVP 开发 : 内部测试
    2024 Q3 : 公开 Beta : 收集反馈
    2024 Q4 : 正式发布 v1.0 : 市场推广
    2025 Q1 : 功能迭代 : 性能优化
```

### 15. Sankey（桑基图）

```mermaid
sankey-beta

%% 用户流量分布
首页,商品列表 : 45.0
首页,搜索结果 : 30.0
首页,直接离开 : 25.0
商品列表,商品详情 : 35.0
商品列表,返回首页 : 10.0
搜索结果,商品详情 : 22.0
搜索结果,返回首页 : 8.0
商品详情,加入购物车 : 32.0
商品详情,离开 : 25.0
加入购物车,下单 : 20.0
加入购物车,离开 : 12.0
下单,支付成功 : 15.0
下单,支付失败 : 5.0
```

### 16. XY Chart（XY 图）

```mermaid
xychart-beta
    title "月度销售额（万元）"
    x-axis [一月, 二月, 三月, 四月, 五月, 六月]
    y-axis "销售额" 0 --> 100
    bar [45, 52, 38, 65, 72, 88]
    line [45, 52, 38, 65, 72, 88]
```

### 17. Block Diagram（框图）

```mermaid
block-beta
    columns 1
    block:App[应用层]
        columns 3
        Web["Web 前端"] API["API 网关"] Mobile["移动端"]
    end
    space
    block:Service[服务层]
        columns 2
        Auth["认证服务"] Biz["业务服务"]
    end
    space
    block:Data[数据层]
        columns 2
        DB[("主数据库")] Cache[("缓存")]
    end

    App --> Service
    Service --> Data
```

### 18. Packet（网络数据包图 — 仅限文字渲染）

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

## 11.2 GeoJSON / TopoJSON 地图

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

## 11.3 STL 3D 模型

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
endsolid
```

## 11.4 数学表达式

> GitHub 使用 MathJax 渲染 LaTeX 数学表达式。

**内联（`$` 分隔符）：** $\sqrt{3x-1}+(1+x)^2$

**内联（反引号语法）：** $`\sqrt{3x-1}+(1+x)^2`$

**块级（`$$` 分隔符）：**

$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$

**块级（````math` 代码块）：**

```math
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
```

**更多示例：** $E = mc^2$ · $`\frac{a}{b}`$

```math
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
```

---
