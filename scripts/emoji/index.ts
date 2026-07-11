import { writeTextIfChanged } from "../shared/files";
import { project } from "../shared/project";
import {
  assertCompleteEmojiSources,
  createEmojiCatalog,
  renderEmojiModule,
  type EmojiCatalogInput
} from "./generate";
import { fetchEmojiSourceTexts, parseGitHubEmojiMap } from "./source";
import { parseEmojiVariationBases, parseUnicodeProperty } from "./unicode";

const sources = await fetchEmojiSourceTexts(project.urls);
const emojiUrls = parseGitHubEmojiMap(sources.githubEmoji);

const input: EmojiCatalogInput = {
  emojiUrls,
  presentation: {
    emojiStyleBases: parseEmojiVariationBases(sources.unicodeEmojiVariationSequences),
    defaultEmojiBases: parseUnicodeProperty(sources.unicodeEmojiData, "Emoji_Presentation")
  }
};
assertCompleteEmojiSources(input);
const catalog = createEmojiCatalog(input);
const result = await writeTextIfChanged(
  project.paths.emojiModule,
  renderEmojiModule(catalog, project.urls.githubEmoji)
);

console.log(
  `${result === "unchanged" ? "Checked" : "Wrote"} ${catalog.unicode.length} Unicode and ${catalog.images.length} image emoji aliases`
);
