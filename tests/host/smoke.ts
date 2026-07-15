import * as vscode from "vscode";
import MarkdownIt from "markdown-it";

type ExtensionApi = {
  extendMarkdownIt(markdownIt: MarkdownIt): MarkdownIt;
};

const disallowedRawHtmlTags = [
  "title",
  "textarea",
  "style",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "script",
  "plaintext"
] as const;

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
    "Long run: ~~~not~~~.",
    "",
    'Allowed HTML: <strong data-allowed="true">strong</strong>.',
    "",
    "<details open><summary>Allowed details</summary><p>Details body</p></details>",
    "",
    '<picture><source srcset="/image.webp"><img src="/image.png" alt="allowed"></picture>',
    "",
    'title: <TiTlE data-case="mixed">title content</TiTlE>.',
    "",
    'textarea: <textarea rows="2">textarea content</textarea>.',
    "",
    'style: <style media="screen">style content</style>.',
    "",
    'xmp: <xmp data-case="xmp">xmp content</xmp>.',
    "",
    'iframe: <iframe src="/frame">iframe content</iframe>.',
    "",
    'noembed: <noembed data-case="noembed">noembed content</noembed>.',
    "",
    'noframes: <noframes data-case="noframes">noframes content</noframes>.',
    "",
    'script: <script type="text/plain">script content</script>.',
    "",
    'plaintext: <plaintext data-case="plaintext">plaintext content</plaintext>.',
    "",
    "Code span: `<script>inline code</script>`.",
    "",
    "Escaped: \\<iframe>escaped\\</iframe>.",
    "",
    "```html",
    "<style>fenced-tagfilter-literal</style>",
    "```"
  ].join("\n");
  const directHtml = api.extendMarkdownIt(new MarkdownIt({ html: true })).render(markdown);
  assertRenderedMarkdown(directHtml, "exported Markdown-it hook");

  const previewHtml = await vscode.commands.executeCommand<string>("markdown.api.render", markdown);
  assertRenderedMarkdown(previewHtml, "VS Code Markdown renderer contribution");
  assertTagfilter(previewHtml);

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

function assertTagfilter(html: string | undefined): void {
  assert(html, "VS Code Markdown renderer contribution returns HTML for tagfilter checks");
  const lowerHtml = html.toLowerCase();
  for (const tag of disallowedRawHtmlTags) {
    assert(lowerHtml.includes(`&lt;${tag}`), `${tag} opening tag is rendered as text`);
    assert(lowerHtml.includes(`&lt;/${tag}>`), `${tag} closing tag is rendered as text`);
    assert(!lowerHtml.includes(`<${tag}`), `${tag} is absent from final raw HTML`);
  }

  assert(
    html.includes('<strong data-allowed="true">strong</strong>'),
    "Allowed raw HTML remains rendered"
  );
  assert(html.includes("<details open>"), "Details remain rendered");
  assert(html.includes("<picture>"), "Picture remains rendered");
  assert(html.includes('src="./image.png"'), "Root HTML image paths remain rewritten");
  assert(
    html.includes("<code>&lt;script&gt;inline code&lt;/script&gt;</code>"),
    "Code spans keep raw tag text literal"
  );
  assert(
    html.includes("&lt;iframe&gt;escaped&lt;/iframe&gt;"),
    "Escaped raw tag input remains literal"
  );
  assert(
    html.includes("<pre><code") && html.includes("fenced-tagfilter-literal"),
    "Fenced code keeps its block and raw tag text"
  );
}

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Host smoke test failed: ${message}`);
  }
}
