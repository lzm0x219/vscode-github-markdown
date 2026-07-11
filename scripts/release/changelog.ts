const sectionBoundary = /^##\s+\[[^\]]+\][^\n]*$|^\[[^\]]+\]:/m;

export function extractRelease(changelog: string, version: string): string {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const versionHeading = new RegExp(`^##\\s+\\[v?${escapedVersion}\\][^\\n]*$`, "m");
  const heading = versionHeading.exec(changelog);
  if (!heading) {
    throw new Error(`Cannot extract release notes: version ${version} was not found`);
  }

  const bodyStart = heading.index + heading[0].length;
  const remainder = changelog.slice(bodyStart);
  const nextBoundary = remainder.search(sectionBoundary);
  const body = (nextBoundary === -1 ? remainder : remainder.slice(0, nextBoundary)).trim();

  return body ? `## What's Changed\n\n${body}` : "## What's Changed";
}
