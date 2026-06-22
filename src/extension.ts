import vscode from "vscode";
import type MarkdownIt from "markdown-it";
import { changeThemeMode, changeLightTheme, changeDarkTheme, changeSingleTheme } from "./commands";
import { onMarkdownPreviewRefresh } from "./events";
import { syncCurrentMermaidTheme } from "./integrations/mermaid";
import alerts from "./plugins/markdown-it-github-alerts";
import emoji from "./plugins/markdown-it-github-emoji";
import footnotes from "./plugins/markdown-it-github-footnotes";
import imageUrl from "./plugins/markdown-it-github-image-url";
import taskLists from "./plugins/markdown-it-github-task-lists";
import theme from "./plugins/markdown-it-github-theme";

export async function activate(context: vscode.ExtensionContext): Promise<{
  extendMarkdownIt(md: MarkdownIt): MarkdownIt;
}> {
  // register commands
  context.subscriptions.push(changeThemeMode, changeSingleTheme, changeLightTheme, changeDarkTheme);

  // register events
  context.subscriptions.push(onMarkdownPreviewRefresh);

  await syncCurrentMermaidTheme();

  return {
    extendMarkdownIt(md: MarkdownIt): MarkdownIt {
      return md.use(taskLists).use(alerts).use(emoji).use(footnotes).use(theme).use(imageUrl);
    }
  };
}
