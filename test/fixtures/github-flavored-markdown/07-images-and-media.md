# 七、图片与媒体

> **用途：** 在 VS Code 中打开此文件，使用 `vscode-github-markdown` 预览，与 [GitHub 上的渲染结果](https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown/07-images-and-media.md) 逐项对比。
>
> **索引：** [返回总清单](../github-flavored-markdown-checklist.md)

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
