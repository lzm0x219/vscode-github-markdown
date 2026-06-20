import { verifyGithubMarkdownPlugins } from "./verify/github-markdown";

verifyGithubMarkdownPlugins();

console.log("Verified GitHub Markdown task lists, footnotes, and alerts.");
console.log("");
console.log(
  "For visual comparison, open test/fixtures/github-flavored-markdown-checklist.md in VS Code"
);
console.log(
  "and compare the preview with https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown-checklist.md"
);
