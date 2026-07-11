import { describe, expect, it, vi } from "vitest";
import { parityCases } from "../../../scripts/parity/cases";

vi.mock("vscode", () => ({ l10n: { t: (message: string) => message } }));

describe("GitHub parity case rendering", () => {
  it("requires integration-boundary comparisons to stay within their budgets", async () => {
    const { evaluateComparison } = await import("../../../scripts/parity/cli");
    const limits = { pixels: 100, pixelRatio: 0.1, areaPixels: 20 };

    expect(
      evaluateComparison(
        { diffPixels: 100, diffPixelRatio: 0.1, largestDiffAreaPixels: 20 },
        limits,
        "Host renderer"
      )
    ).toEqual({ passed: true, status: "integration-boundary", note: "Host renderer" });
    expect(
      evaluateComparison(
        { diffPixels: 101, diffPixelRatio: 0.1, largestDiffAreaPixels: 20 },
        limits,
        "Host renderer"
      )
    ).toEqual({ passed: false, status: "fail", note: "Host renderer" });
  });

  it("renders each repository file once and shares its HTML across themes", async () => {
    const { renderAllGitHubCases } = await import("../../../scripts/parity/cli");
    const cases = parityCases.filter(
      ({ id }) => id === "corpus-01-light" || id === "corpus-01-dark"
    );
    const renderRepositoryFile = vi.fn(async () => "<p>repository file</p>");

    const result = await renderAllGitHubCases(cases, vi.fn(), renderRepositoryFile);

    expect(renderRepositoryFile).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      "corpus-01-light": "<p>repository file</p>",
      "corpus-01-dark": "<p>repository file</p>"
    });
  });

  it("replaces a configurable branch ref with immutable commit provenance", async () => {
    const { resolveRepositoryReferences } = await import("../../../scripts/parity/cli");
    const sourceCase = parityCases.find(({ id }) => id === "corpus-01-light")!;
    const branchCase = {
      ...sourceCase,
      reference: { ...sourceCase.reference, ref: "feature/parity" }
    };

    const [resolved] = await resolveRepositoryReferences([branchCase], async () => "b".repeat(40));

    expect(resolved?.reference).toEqual({
      kind: "repository-file",
      repository: "lzm0x219/vscode-github-markdown",
      path: "tests/fixtures/github-flavored-markdown/01-basic-formatting.md",
      ref: "b".repeat(40)
    });
  });
});
