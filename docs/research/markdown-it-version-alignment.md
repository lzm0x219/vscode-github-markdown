# MarkdownIt 与 VS Code 宿主版本对齐

核对日期：2026-08-31。这里只采用 VS Code 官方仓库的版本化 manifest、锁文件和实现源码；“stable”按当天官方最新稳定版 `1.135.0` 解释。

## 结论

- `markdown-it@15.0.0` **不对应当前任何受测 VS Code 宿主**。它来自 Renovate 的 [`2e4ca0cf`](https://github.com/lzm0x219/vscode-github-markdown/commit/2e4ca0cf6636b10c4c1996ffdaf9b34eada1131e) 自动升级，随后随 [PR #1301](https://github.com/lzm0x219/vscode-github-markdown/pull/1301) 合入；不是 VS Code 兼容性要求。
- 项目的最终预览固定宿主 `1.129.0` 和当前稳定版 `1.135.0` 都实际安装 `markdown-it@14.2.0`。因此本项目用于单测、本地一致性渲染和类型检查的主 `devDependency` 应固定为 **`markdown-it@14.2.0`**，并恢复该宿主使用的 **`@types/markdown-it@14.1.2`**。
- 最低支持宿主 `1.74.0` 使用 `markdown-it@12.3.2`。一个本地依赖无法同时精确等于 12.3.2 和 14.2.0；最低版兼容性应继续由真实 `1.74.0` host smoke 保证。新增插件逻辑不得依赖只在 14.x 存在的运行时 API，必要时应再增加最低版最终预览用例。
- 不应继续使用 15.x，除非 VS Code 的目标/固定宿主也升级到内置 15.x，或项目明确改为自带独立 MarkdownIt 运行时。当前扩展并非这种架构。

## 版本证据

| 项目对应宿主   | 项目中的选择                                                                                                  | VS Code manifest                                      | VS Code 锁文件实际版本                            |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| 最低支持桌面版 | `engines.vscode = ^1.74.0`；CI 下载 `1.74.0`                                                                  | `markdown-it: ^12.3.2`；`@types/markdown-it: 12.2.3`  | `markdown-it@12.3.2`                              |
| 固定最终预览   | 桌面 `1.129.0`；Web commit `125df467…`，即官方 `1.129.0` tag commit                                           | `markdown-it: ^14.2.0`；`@types/markdown-it: ^14.1.2` | `markdown-it@14.2.0`；`@types/markdown-it@14.1.2` |
| 当前稳定版     | CI 使用动态 `stable`；2026-08-31 对应官方 [1.135.0](https://github.com/microsoft/vscode/releases/tag/1.135.0) | `markdown-it: ^14.2.0`；`@types/markdown-it: ^14.1.2` | `markdown-it@14.2.0`；`@types/markdown-it@14.1.2` |

项目自身的版本和 CI 入口见 [`package.json`](../../package.json#L66-L80)、[`engines.vscode`](../../package.json#L260-L262)、[host matrix](../../.github/workflows/ci.yml#L62-L82) 和 [`hostVersions`](../../scripts/host/versions.ts#L1-L7)。官方版本化证据如下：

- VS Code 1.74.0：[manifest](https://github.com/microsoft/vscode/blob/1.74.0/extensions/markdown-language-features/package.json#L622-L637)、[yarn.lock](https://github.com/microsoft/vscode/blob/1.74.0/extensions/markdown-language-features/yarn.lock#L420-L423)。
- VS Code 1.129.0：[manifest](https://github.com/microsoft/vscode/blob/1.129.0/extensions/markdown-language-features/package.json#L914-L930)、[package-lock.json](https://github.com/microsoft/vscode/blob/1.129.0/extensions/markdown-language-features/package-lock.json#L1532-L1535)、[类型锁定](https://github.com/microsoft/vscode/blob/1.129.0/extensions/markdown-language-features/package-lock.json#L535-L537)。固定 Web commit 与该 tag 的 commit 均为 [`125df4672b8a6a34975303c6b0baa124e560a4f7`](https://github.com/microsoft/vscode/commit/125df4672b8a6a34975303c6b0baa124e560a4f7)。
- VS Code 1.135.0：[manifest](https://github.com/microsoft/vscode/blob/1.135.0/extensions/markdown-language-features/package.json#L1792-L1808)、[package-lock.json](https://github.com/microsoft/vscode/blob/1.135.0/extensions/markdown-language-features/package-lock.json#L1562-L1565)、[类型锁定](https://github.com/microsoft/vscode/blob/1.135.0/extensions/markdown-language-features/package-lock.json#L536-L538)。

## 为什么必须按宿主对齐

VS Code 的 Markdown 引擎先从其内置依赖创建 MarkdownIt 实例，再把**同一个实例**逐个交给 `markdown.markdownItPlugins` 贡献者处理：[1.74.0 实现](https://github.com/microsoft/vscode/blob/1.74.0/extensions/markdown-language-features/src/markdownEngine.ts#L120-L131)、[1.135.0 实现](https://github.com/microsoft/vscode/blob/1.135.0/extensions/markdown-language-features/src/markdownEngine.ts#L133-L144)。本扩展也只是导出 `extendMarkdownIt(md)` 并修改传入实例，没有创建或携带生产运行时，见 [`src/extension.ts`](../../src/extension.ts#L10-L23) 和 [`src/markdown-it.ts`](../../src/markdown-it.ts#L12-L22)。

所以本地 `markdown-it` 的职责是模拟宿主用于单元测试和生成基线，而不是决定用户 VS Code 中的实际版本。用 15.x 跑本地测试会制造一个生产宿主不存在的验证环境；固定为 14.2.0 才能与当前稳定/固定预览宿主一致，同时保留 1.74.0 真实宿主测试覆盖旧版兼容边界。
