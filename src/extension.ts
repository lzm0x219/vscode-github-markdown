import vscode from "vscode";
import type MarkdownIt from "markdown-it";
import { registerThemeCommands } from "./commands";
import { registerMarkdownPreviewEvents } from "./events";
import { updateMermaidThemeSync } from "./integrations/mermaid";
import alerts from "./plugins/markdown-it-github-alerts";
import directionality from "./plugins/markdown-it-github-directionality";
import emoji from "./plugins/markdown-it-github-emoji";
import footnotes from "./plugins/markdown-it-github-footnotes";
import imageUrl from "./plugins/markdown-it-github-image-url";
import strikethrough from "./plugins/markdown-it-github-strikethrough";
import tagfilter from "./plugins/markdown-it-github-tagfilter";
import taskLists from "./plugins/markdown-it-github-task-lists";
import theme from "./plugins/markdown-it-github-theme";

export async function activate(context: vscode.ExtensionContext): Promise<{
  extendMarkdownIt(md: MarkdownIt): MarkdownIt;
}> {
  context.subscriptions.push(...registerThemeCommands());
  context.subscriptions.push(registerMarkdownPreviewEvents(context.globalState));

  try {
    await updateMermaidThemeSync(context.globalState);
  } catch (error) {
    console.error("[github-markdown] Failed to sync Mermaid theme on activation:", error);
  }

  return {
    extendMarkdownIt(md: MarkdownIt): MarkdownIt {
      return md
        .use(strikethrough)
        .use(tagfilter)
        .use(taskLists)
        .use(alerts)
        .use(emoji)
        .use(footnotes)
        .use(directionality)
        .use(theme)
        .use(imageUrl);
    }
  };
}
