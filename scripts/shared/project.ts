import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../../package.json", import.meta.url)));
const unicodeVersion = "17.0.0";
const unicodeEmojiBaseUrl = `https://unicode.org/Public/${unicodeVersion}/ucd/emoji`;

export const project = {
  root,
  paths: {
    dist: join(root, "dist"),
    packageJson: join(root, "package.json"),
    previewCssSource: join(root, "src", "extension.preview.css"),
    previewCssOutput: join(root, "dist", "extension.preview.css"),
    previewScriptSource: join(root, "src", "extension.preview.ts"),
    changelog: join(root, "CHANGELOG.md"),
    emojiModule: join(root, "src", "generated", "github-emojis.ts")
  },
  urls: {
    githubEmoji: "https://api.github.com/emojis",
    unicodeEmojiData: `${unicodeEmojiBaseUrl}/emoji-data.txt`,
    unicodeEmojiVariationSequences: `${unicodeEmojiBaseUrl}/emoji-variation-sequences.txt`
  }
} as const;
