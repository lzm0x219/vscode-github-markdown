import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, _context, nextResolve) {
    if (specifier !== "vscode") return nextResolve(specifier);
    return {
      shortCircuit: true,
      url: "data:text/javascript,export const l10n={t:(message)=>message};"
    };
  }
});

const { verifyMarkdownCompatibility } = await import("./markdown");
verifyMarkdownCompatibility();

console.log(
  "Verified task lists, footnotes, alerts, emoji, strikethrough, tagfilter, and Mermaid dependency boundaries"
);
console.log("Visual fixture: tests/fixtures/github-flavored-markdown-checklist.md");
