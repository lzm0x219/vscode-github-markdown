import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

export function extractReleaseNotes(changelog: string): string {
  const match = changelog.match(
    /^(##\s+\[[^\]]+\][^\n]*\n[\s\S]*?)(?=^##\s+\[[^\]]+\][^\n]*\n|^\[[^\]]+\]:)/m
  );

  if (!match?.[1]) {
    throw new Error("Cannot find latest changelog section");
  }

  return match[1].trim().replace(/^##\s+\[[^\]]+\][^\n]*/, "## What's Changed");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const changelog = await fs.readFile("CHANGELOG.md", "utf8");
  const notes = extractReleaseNotes(changelog);

  await fs.writeFile(`${process.env["GITHUB_WORKSPACE"]}-CHANGELOG.txt`, notes + "\n", "utf8");
}
