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
    "```",
    "",
    "## rtl-host-heading مرحباً بالعالم",
    "",
    "rtl-host-paragraph فقرة عربية لاختبار اتجاه النص.",
    "",
    "rtl-host-mixed Mixed English العربية 123.",
    "",
    "- rtl-host-list-item عنصر عربي",
    "- rtl-host-mixed-list Mixed item العربية",
    "",
    "> [!NOTE]",
    "> rtl-host-alert تنبيه عربي with English.",
    "",
    "rtl-host-footnote-reference العربية.[^rtl]",
    "",
    "[^rtl]: rtl-host-footnote-definition ملاحظة هامشية mixed English.",
    "",
    "Inline direction code: `rtl-inline-code-direction العربية`.",
    "",
    "```text",
    "rtl-block-code-direction العربية",
    "```",
    "",
    "    rtl-indented-code-direction العربية",
    "",
    '<p dir="rtl" data-direction="explicit-rtl">rtl-explicit-direction العربية</p>',
    "",
    '<p dir="ltr" data-direction="explicit-ltr">ltr-explicit-direction English</p>'
  ].join("\n");
  const directHtml = api.extendMarkdownIt(new MarkdownIt({ html: true })).render(markdown);
  assertRenderedMarkdown(directHtml, "exported Markdown-it hook");

  const previewHtml = await vscode.commands.executeCommand<string>("markdown.api.render", markdown);
  assertRenderedMarkdown(previewHtml, "VS Code Markdown renderer contribution");
  assertTagfilter(previewHtml);
  assertDirectionality(previewHtml);

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

function assertDirectionality(html: string | undefined): void {
  assert(html, "VS Code Markdown renderer contribution returns HTML for directionality checks");
  assert(
    elementHasDirection(html, "h2", "auto", "rtl-host-heading مرحباً بالعالم"),
    "RTL headings use automatic direction in final preview HTML"
  );
  assert(
    elementHasDirection(html, "p", "auto", "rtl-host-paragraph فقرة عربية"),
    "RTL paragraphs use automatic direction in final preview HTML"
  );
  assert(
    elementHasDirection(html, "p", "auto", "rtl-host-mixed Mixed English العربية"),
    "Mixed-direction paragraphs use automatic direction in final preview HTML"
  );
  assert(
    elementHasDirection(html, "ul", "auto", "rtl-host-list-item عنصر عربي"),
    "RTL lists use automatic direction in final preview HTML"
  );
  assert(
    elementHasDirection(html, "div", "auto", "rtl-host-alert تنبيه عربي"),
    "RTL alerts use automatic direction in final preview HTML"
  );
  assert(
    elementHasDirection(html, "p", "auto", "rtl-host-footnote-reference العربية"),
    "RTL footnote references use automatic direction in final preview HTML"
  );
  assert(
    elementHasDirection(html, "p", "auto", "rtl-host-footnote-definition ملاحظة هامشية"),
    "RTL footnote definitions use automatic direction in final preview HTML"
  );
  assert(
    elementHasDirection(html, "p", "rtl", "rtl-explicit-direction العربية"),
    "Explicit RTL direction remains unchanged"
  );
  assert(
    elementHasDirection(html, "p", "ltr", "ltr-explicit-direction English"),
    "Explicit LTR direction remains unchanged"
  );

  const inlineCode = html.match(/<code\b([^>]*)>rtl-inline-code-direction العربية<\/code>/);
  assert(inlineCode && !/\bdir=/.test(inlineCode[1] ?? ""), "Inline code has no direction");
  assert(
    codeBlockHasNoDirection(html, "rtl-block-code-direction العربية"),
    "Fenced code blocks have no direction"
  );
  assert(
    codeBlockHasNoDirection(html, "rtl-indented-code-direction العربية"),
    "Indented code blocks have no direction"
  );
}

function codeBlockHasNoDirection(html: string, marker: string): boolean {
  const markerIndex = html.indexOf(marker);
  const preStart = html.lastIndexOf("<pre", markerIndex);
  const codeStart = html.lastIndexOf("<code", markerIndex);
  const preAttributes = html.slice(preStart, html.indexOf(">", preStart));
  const codeAttributes = html.slice(codeStart, html.indexOf(">", codeStart));
  return (
    markerIndex >= 0 &&
    preStart >= 0 &&
    codeStart >= 0 &&
    !/\bdir=/.test(preAttributes) &&
    !/\bdir=/.test(codeAttributes)
  );
}

function elementHasDirection(
  html: string,
  tag: string,
  direction: "auto" | "ltr" | "rtl",
  text: string
): boolean {
  let textIndex = html.indexOf(text);
  while (textIndex >= 0) {
    const openIndex = html.lastIndexOf(`<${tag}`, textIndex);
    const openEnd = html.indexOf(">", openIndex);
    const closeIndex = html.indexOf(`</${tag}>`, openEnd);
    if (openIndex >= 0 && openEnd < textIndex && closeIndex > textIndex) {
      const attributes = html.slice(openIndex + tag.length + 1, openEnd);
      if (/^\s/.test(attributes) && new RegExp(`\\bdir="${direction}"`).test(attributes)) {
        return true;
      }
    }
    textIndex = html.indexOf(text, textIndex + text.length);
  }
  return false;
}

function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Host smoke test failed: ${message}`);
  }
}
