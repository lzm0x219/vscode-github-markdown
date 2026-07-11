export function screenshotKeys(caseId: string): { reference: string; current: string } {
  return { reference: `${caseId}-reference`, current: `${caseId}-current` };
}

export function artifactNames(
  caseId: string,
  source: "github" | "local"
): { expected: string; actual: string; diff: string } {
  return {
    expected: `${caseId}-github.png`,
    actual: `${caseId}-${source === "github" ? "current-github" : "local"}.png`,
    diff: `${caseId}-diff.png`
  };
}
