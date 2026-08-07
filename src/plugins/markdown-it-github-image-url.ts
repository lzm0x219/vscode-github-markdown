import * as vscode from "vscode";
import type MarkdownIt from "markdown-it";

const imageTagPattern = /<img(?=[\t\n\f\r />])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const projectRootSrcAttributePattern =
  /(<img(?:[^"'<>]|"[^"]*"|'[^']*')*?[\t\n\f\r ]+src[\t\n\f\r ]*=[\t\n\f\r ]*)(?:(["'])(\/(?!\/)[^"']+)\2|(\/(?!\/)[^\t\n\f\r "'`=<>]+))/i;
const htmlEntityPattern = /&(?:#[xX][\da-fA-F]+;?|#\d+;?|[a-zA-Z][a-zA-Z0-9]{1,31};?)/g;
// WHATWG named character references that may omit their trailing semicolon:
// https://html.spec.whatwg.org/entities.json
const legacyHtmlEntityNames = new Set(
  "AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT Iacute Icirc Igrave Iuml LT Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN Uacute Ucirc Ugrave Uuml Yacute aacute acirc acute aelig agrave amp aring atilde auml brvbar ccedil cedil cent copy curren deg divide eacute ecirc egrave eth euml frac12 frac14 frac34 gt iacute icirc iexcl igrave iquest iuml laquo lt macr micro middot nbsp not ntilde oacute ocirc ograve ordf ordm oslash otilde ouml para plusmn pound quot raquo reg sect shy sup1 sup2 sup3 szlig thorn times uacute ucirc ugrave uml uuml yacute yen yuml".split(
    " "
  )
);

type ImageRenderEnv = {
  currentDocument?: vscode.Uri;
  resourceProvider?: Pick<vscode.Webview, "asWebviewUri">;
};

function rewriteImgSrc(
  html: string,
  env: ImageRenderEnv | undefined,
  decodeHtmlEntity: (entity: string) => string
): string {
  return html.replace(imageTagPattern, (imageTag) =>
    imageTag.replace(
      projectRootSrcAttributePattern,
      (_match, before, quote = "", quotedSrc, unquotedSrc) => {
        const src = decodeHtmlEntities(quotedSrc ?? unquotedSrc, decodeHtmlEntity);
        return `${before}${serializeAttributeValue(toProjectRootResourceUri(src, env), quote)}`;
      }
    )
  );
}

function decodeHtmlEntities(value: string, decodeHtmlEntity: (entity: string) => string): string {
  return value.replace(htmlEntityPattern, (entity, offset: number) => {
    if (entity.endsWith(";")) return decodeHtmlEntity(entity);
    if (entity.startsWith("&#")) return decodeHtmlEntity(`${entity};`);

    const nextCharacter = value[offset + entity.length];
    if (
      !legacyHtmlEntityNames.has(entity.slice(1)) ||
      (nextCharacter !== undefined && /[=0-9A-Za-z]/.test(nextCharacter))
    ) {
      return entity;
    }
    return decodeHtmlEntity(`${entity};`);
  });
}

function serializeAttributeValue(value: string, quote: string): string {
  const delimiter = quote === "'" ? "'" : '"';
  const escaped = value
    .replaceAll("&", "&amp;")
    .replaceAll(delimiter, delimiter === '"' ? "&quot;" : "&#39;");
  return `${delimiter}${escaped}${delimiter}`;
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
        tokens[idx].content = rewriteImgSrc(tokens[idx].content, env as ImageRenderEnv, (entity) =>
          md.utils.unescapeAll(entity)
        );
      }
      return defaultRender(tokens, idx, options, env, self);
    };
  }
  return md;
}
