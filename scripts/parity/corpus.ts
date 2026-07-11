import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { project } from "../shared/project";

export type CorpusFixture = { id: string; file: string; path: string; markdown: string };

const corpusDirectory = join(project.root, "tests", "fixtures", "github-flavored-markdown");

export function loadCorpusFixtures(): CorpusFixture[] {
  return readdirSync(corpusDirectory)
    .filter((fileName) => /^\d{2}-.+\.md$/.test(fileName))
    .sort()
    .map((fileName) => {
      const file = fileName.slice(0, 2);
      return {
        id: `corpus-${file}`,
        file,
        path: `tests/fixtures/github-flavored-markdown/${fileName}`,
        markdown: readFileSync(join(corpusDirectory, fileName), "utf8")
      };
    });
}
