import * as vscode from "vscode";
import type MarkdownIt from "markdown-it";

const imageTagPattern = /<img(?=[\t\n\f\r />])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const projectRootSrcAttributePattern =
  /(<img(?:[^"'<>]|"[^"]*"|'[^']*')*?[\t\n\f\r ]+src[\t\n\f\r ]*=[\t\n\f\r ]*)(?:(["'])(\/(?!\/)[^"']+)\2|(\/(?!\/)[^\t\n\f\r "'`=<>]+))/i;

type ImageRenderEnv = {
  currentDocument?: vscode.Uri;
  resourceProvider?: Pick<vscode.Webview, "asWebviewUri">;
};

function rewriteImgSrc(html: string, env: ImageRenderEnv | undefined): string {
  return html.replace(imageTagPattern, (imageTag) =>
    imageTag.replace(
      projectRootSrcAttributePattern,
      (_match, before, quote = "", quotedSrc, unquotedSrc) =>
        `${before}${quote}${toProjectRootResourceUri(quotedSrc ?? unquotedSrc, env)}${quote}`
    )
  );
}

function toProjectRootResourceUri(src: string, env: ImageRenderEnv | undefined): string {
  const currentDocument = env?.currentDocument;
  const resourceProvider = env?.resourceProvider;
  const workspaceFolder = currentDocument
    ? vscode.workspace.getWorkspaceFolder(currentDocument)
    : undefined;
  if (!workspaceFolder || !resourceProvider) return `.${src}`;

  try {
    const parsed = vscode.Uri.parse(`markdown-link:${src}`);
    const resource = vscode.Uri.joinPath(workspaceFolder.uri, parsed.path).with({
      fragment: parsed.fragment,
      query: parsed.query
    });
    return resourceProvider.asWebviewUri(resource).toString(true);
  } catch {
    return `.${src}`;
  }
}

export default function markdownItImageUrl(md: MarkdownIt): MarkdownIt {
  for (const ruleName of ["html_block", "html_inline"] as const) {
    const defaultRender =
      md.renderer.rules[ruleName] ??
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules[ruleName] = (tokens, idx, options, env, self) => {
      if (tokens[idx]) {
        tokens[idx].content = rewriteImgSrc(tokens[idx].content, env as ImageRenderEnv);
      }
      return defaultRender(tokens, idx, options, env, self);
    };
  }
  return md;
}
