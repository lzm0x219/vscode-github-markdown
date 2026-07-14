import * as vscode from "vscode";
import MarkdownIt from "markdown-it";

type ExtensionApi = {
  extendMarkdownIt(markdownIt: MarkdownIt): MarkdownIt;
};

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension<ExtensionApi>("lzm0x219.vscode-github-markdown");
  assert(extension, "Extension is available in the development host");

  const api = await extension.activate();
  assert(extension.isActive, "Extension activates successfully");
  assert(typeof api.extendMarkdownIt === "function", "Extension exports the Markdown-it hook");

  const commands = await vscode.commands.getCommands(true);
  assert(
    commands.includes("vscode-github-markdown.changeThemeMode"),
    "Theme commands are registered after activation"
  );

  const html = api
    .extendMarkdownIt(new MarkdownIt({ html: true }))
    .render("- [x] Host smoke test\n\n> [!NOTE]\n> :rocket: Ready.");
  assert(html.includes('class="vscode-github-markdown"'), "Theme wrapper is rendered");
  assert(html.includes("task-list-item-checkbox"), "Task lists are rendered");
  assert(html.includes("markdown-alert-note"), "Alerts are rendered");
  assert(html.includes("🚀"), "Emoji shortcodes are rendered");
}

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Host smoke test failed: ${message}`);
  }
}
