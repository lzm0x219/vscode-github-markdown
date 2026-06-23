import type MarkdownIt from "markdown-it";

export type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];

export type MarkdownState = {
  Token: new (...args: unknown[]) => MarkdownToken;
  env: Record<string, unknown>;
  tokens: MarkdownToken[];
};
