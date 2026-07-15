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

  const markdown = [
    "- [x] Host smoke test",
    "",
    "> [!NOTE]",
    "> :rocket: Ready.",
    "",
    "~~Hi~~ Hello, ~there~ world!",
    "",
    "Escaped: \\~escaped\\~.",
    "",
    "Code: `~code~`.",
    "",
    "Empty: ~~.",
    "",
    "Unmatched: ~open.",
    "",
    "Long run: ~~~not~~~."
  ].join("\n");
  const directHtml = api.extendMarkdownIt(new MarkdownIt({ html: true })).render(markdown);
  assertRenderedMarkdown(directHtml, "exported Markdown-it hook");

  const previewHtml = await vscode.commands.executeCommand<string>("markdown.api.render", markdown);
  assertRenderedMarkdown(previewHtml, "VS Code Markdown renderer contribution");

  const previewStyles = extension.packageJSON.contributes?.["markdown.previewStyles"] as
    | string[]
    | undefined;
  assert(previewStyles?.includes("./dist/extension.preview.css"), "Preview style is contributed");
  await vscode.workspace.fs.stat(
    vscode.Uri.joinPath(extension.extensionUri, "dist", "extension.preview.css")
  );
}

function assertRenderedMarkdown(html: string | undefined, source: string): void {
  assert(html, `${source} returns HTML`);
  assert(html.includes('class="vscode-github-markdown"'), "Theme wrapper is rendered");
  assert(html.includes("task-list-item-checkbox"), "Task lists are rendered");
  assert(html.includes("markdown-alert-note"), "Alerts are rendered");
  assert(html.includes("🚀"), "Emoji shortcodes are rendered");
  assert(html.includes("<s>Hi</s>"), "Double-tilde strikethrough keeps its existing markup");
  assert(html.includes("<del>there</del>"), "Single-tilde strikethrough is rendered");
  assert(html.includes("Escaped: ~escaped~."), "Escaped tildes remain literal");
  assert(html.includes("<code>~code~</code>"), "Tildes in code spans remain literal");
  assert(html.includes("Empty: ~~."), "Empty strikethrough delimiters remain literal");
  assert(html.includes("Unmatched: ~open."), "Unmatched tildes remain literal");
  assert(html.includes("Long run: ~~~not~~~."), "Runs longer than two tildes remain literal");
}

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Host smoke test failed: ${message}`);
  }
}
