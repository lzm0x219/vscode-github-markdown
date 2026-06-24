import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, _context, nextResolve) {
    if (specifier === "vscode") {
      return {
        shortCircuit: true,
        url: "data:text/javascript,export const l10n={t:(message)=>message};"
      };
    }

    return nextResolve(specifier);
  }
});

const { verifyGithubMarkdownPlugins } = await import("./verify/github-markdown");

verifyGithubMarkdownPlugins();

console.log(
  "Verified GitHub Markdown task lists, footnotes, alerts, emoji, and Mermaid dependency guards."
);
console.log("");
console.log(
  "For visual comparison, open test/fixtures/github-flavored-markdown-checklist.md in VS Code"
);
console.log(
  "and compare the preview with https://github.com/lzm0x219/vscode-github-markdown/blob/main/test/fixtures/github-flavored-markdown-checklist.md"
);
