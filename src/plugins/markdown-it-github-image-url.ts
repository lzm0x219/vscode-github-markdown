import * as vscode from "vscode";
import type MarkdownIt from "markdown-it";
import { replaceCodePoint } from "entities/decode";

const imageTagPattern = /<img(?=[\t\n\f\r />])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const responsiveImageTagPattern = /<(?:img|source)(?=[\t\n\f\r />])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const projectRootSrcAttributePattern =
  /(<img(?:[^"'<>]|"[^"]*"|'[^']*')*?[\t\n\f\r ]+src[\t\n\f\r ]*=[\t\n\f\r ]*)(?:(["'])(\/(?!\/)[^"']+)\2|(\/(?!\/)[^\t\n\f\r "'`=<>]+))/i;
const projectRootSrcsetAttributePattern =
  /(<(?:img|source)(?:[^"'<>]|"[^"]*"|'[^']*')*?[\t\n\f\r ]+srcset[\t\n\f\r ]*=[\t\n\f\r ]*)(?:(['"])([^"']*)\2|([^\t\n\f\r "'`=<>]+))/i;
const htmlEntityPattern = /&(?:#[xX][\da-fA-F]+;?|#\d+;?|[a-zA-Z][a-zA-Z0-9]{1,31};?)/g;
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
  decodeNamedEntity: (value: string) => string
): string {
  return html.replace(imageTagPattern, (imageTag) =>
    imageTag.replace(
      projectRootSrcAttributePattern,
      (_match, before, quote = "", quotedSrc, unquotedSrc) => {
        const src = decodeHtmlAttribute(quotedSrc ?? unquotedSrc, decodeNamedEntity);
        return `${before}${serializeAttributeValue(toProjectRootResourceUri(src, env), quote)}`;
      }
    )
  );
}

function rewriteImgSrcset(
  html: string,
  env: ImageRenderEnv | undefined,
  decodeNamedEntity: (value: string) => string
): string {
  return html.replace(responsiveImageTagPattern, (imageTag) =>
    imageTag.replace(
      projectRootSrcsetAttributePattern,
      (_match, before, quote = "", quotedSrcset, unquotedSrcset) => {
        const srcset = decodeHtmlAttribute(quotedSrcset ?? unquotedSrcset, decodeNamedEntity);
        return `${before}${serializeAttributeValue(rewriteSrcset(srcset, env), quote)}`;
      }
    )
  );
}

function rewriteSrcset(srcset: string, env: ImageRenderEnv | undefined): string {
  return srcset.replace(/(^\s*|,\s*)(\/(?!\/)[^\s,]+)/g, (_match, separator, src) => {
    return `${separator}${toProjectRootResourceUri(src, env)}`;
  });
}

function decodeHtmlAttribute(value: string, decodeNamedEntity: (value: string) => string): string {
  return value.replace(htmlEntityPattern, (reference, offset: number, input: string) => {
    if (reference.startsWith("&#")) {
      const hexadecimal = reference[2]?.toLowerCase() === "x";
      const digits = reference.slice(hexadecimal ? 3 : 2, reference.endsWith(";") ? -1 : undefined);
      return String.fromCodePoint(replaceCodePoint(Number.parseInt(digits, hexadecimal ? 16 : 10)));
    }

    if (reference.endsWith(";")) return decodeNamedEntity(reference);

    const name = reference.slice(1);
    const nextCharacter = input[offset + reference.length];
    if (
      !legacyHtmlEntityNames.has(name) ||
      (nextCharacter !== undefined && /[=0-9A-Za-z]/.test(nextCharacter))
    ) {
      return reference;
    }
    return decodeNamedEntity(`${reference};`);
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

function isProjectRootPath(src: string): boolean {
  return src.startsWith("/") && !src.startsWith("//");
}

export default function markdownItImageUrl(md: MarkdownIt): MarkdownIt {
  for (const ruleName of ["html_block", "html_inline"] as const) {
    const defaultRender =
      md.renderer.rules[ruleName] ??
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules[ruleName] = (tokens, idx, options, env, self) => {
      if (tokens[idx]) {
        tokens[idx].content = rewriteImgSrc(
          tokens[idx].content,
          env as ImageRenderEnv,
          md.utils.unescapeAll
        );
        tokens[idx].content = rewriteImgSrcset(
          tokens[idx].content,
          env as ImageRenderEnv,
          md.utils.unescapeAll
        );
      }
      return defaultRender(tokens, idx, options, env, self);
    };
  }

  const defaultImageRender =
    md.renderer.rules.image ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token?.attrGet("src");
    if (token && src && isProjectRootPath(src)) {
      token.attrSet("src", toProjectRootResourceUri(src, env as ImageRenderEnv));
    }
    return defaultImageRender(tokens, idx, options, env, self);
  };

  return md;
}
