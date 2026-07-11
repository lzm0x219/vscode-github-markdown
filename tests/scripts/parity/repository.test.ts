import { describe, expect, it } from "vitest";
import { isGitHubRepository, isRepositoryPath } from "../../../scripts/parity/repository";

describe("GitHub repository input validation", () => {
  it("accepts repository slugs and nested file paths", () => {
    expect(isGitHubRepository("owner/repository.js")).toBe(true);
    expect(isRepositoryPath("tests/fixtures/a file.md")).toBe(true);
  });

  it.each(["owner", "owner/repository/extra", "../repository", "owner/..", "owner/"])(
    "rejects unsafe repository %s",
    (repository) => expect(isGitHubRepository(repository)).toBe(false)
  );

  it.each(["", "/absolute.md", "trailing/", "a//b.md", "../a.md", "a/../b.md", "a\\b.md"])(
    "rejects unsafe repository path %s",
    (path) => expect(isRepositoryPath(path)).toBe(false)
  );
});
