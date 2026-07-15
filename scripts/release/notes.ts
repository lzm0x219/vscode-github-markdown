import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeTextIfChanged } from "../shared/files";
import { extractRelease } from "./changelog";

export type ReleaseNotesInput = {
  workspace: string;
  packageJsonPath: string;
  changelogPath: string;
};

export async function writeReleaseNotes(input: ReleaseNotesInput): Promise<void> {
  const changelog = await readFile(input.changelogPath, "utf8");
  const packageJson = JSON.parse(await readFile(input.packageJsonPath, "utf8")) as {
    version?: unknown;
  };
  if (typeof packageJson.version !== "string") {
    throw new Error("Cannot write release notes: package.json version is missing");
  }

  const releaseNotes = extractRelease(changelog, packageJson.version);
  await writeTextIfChanged(join(input.workspace, "release-CHANGELOG.txt"), `${releaseNotes}\n`);
}
