import fs from "node:fs/promises";

const changelog = await fs.readFile("CHANGELOG.md", "utf8");

const match = changelog.match(
  /^(##\s+\[[^\]]+\][^\n]*\n[\s\S]*?)(?=^##\s+\[[^\]]+\][^\n]*\n|^\[[^\]]+\]:)/m
);

if (!match?.[1]) {
  throw new Error("Cannot find latest changelog section");
}

const notes = match[1].trim();

await fs.writeFile(`${process.env["GITHUB_WORKSPACE"]}-CHANGELOG.txt`, notes + "\n", "utf8");
