import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token";

export default function markdownItBlockquote(md: MarkdownIt) {
  md.renderer.rules.blockquote_open = (tokens, idx, options, _env, _self) => {
    const token = tokens[idx + 2];
    const types = {
      Note: {
        class: "color-fg-accent",
        icon: `<svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>`,
      },
      Warning: {
        class: "color-fg-attention",
        icon: `<svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>`,
      },
    };

    const type = token.content.split("**")[1];

    if (token && type in types) {
      token.children.splice(1, 3);

      const customToken = new Token("html_block", "", 0);

      customToken.content = `
        <span class="${types[type].class}">
          ${types[type].icon}${type}
        </span>
      `;

      token.children.unshift(customToken);

      console.log(token.children);
    }
    return md.renderer.renderToken(tokens, idx, options);
  };
}
