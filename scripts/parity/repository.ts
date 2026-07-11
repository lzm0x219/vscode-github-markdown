const repositorySegmentPattern = /^[\w.-]+$/;

export function isGitHubRepository(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const segments = value.split("/");
  return segments.length === 2 && segments.every(isRepositorySegment);
}

export function isRepositoryPath(value: unknown): value is string {
  if (typeof value !== "string" || value.includes("\\") || hasControlCharacter(value)) {
    return false;
  }
  const segments = value.split("/");
  return segments.length > 0 && segments.every((segment) => isSafeSegment(segment));
}

export function assertGitHubRepository(repository: unknown): asserts repository is string {
  if (!isGitHubRepository(repository)) {
    throw new Error(`Invalid GitHub repository: ${String(repository)}`);
  }
}

export function assertRepositoryPath(path: unknown): asserts path is string {
  if (!isRepositoryPath(path)) {
    throw new Error(`Invalid GitHub repository path: ${String(path)}`);
  }
}

function isRepositorySegment(segment: string): boolean {
  return isSafeSegment(segment) && repositorySegmentPattern.test(segment);
}

function isSafeSegment(segment: string): boolean {
  return segment.length > 0 && segment !== "." && segment !== "..";
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}
