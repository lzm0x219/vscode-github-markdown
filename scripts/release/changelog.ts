const versionHeading = /^##\s+\[[^\]]+\][^\n]*$/m;

export function extractLatestRelease(changelog: string): string {
  const heading = versionHeading.exec(changelog);
  if (!heading) {
    throw new Error("Cannot extract release notes: no version section was found");
  }

  const bodyStart = heading.index + heading[0].length;
  const remainder = changelog.slice(bodyStart);
  const nextBoundary = remainder.search(/^##\s+\[[^\]]+\][^\n]*$|^\[[^\]]+\]:/m);
  const body = (nextBoundary === -1 ? remainder : remainder.slice(0, nextBoundary)).trim();

  return body ? `## What's Changed\n\n${body}` : "## What's Changed";
}
