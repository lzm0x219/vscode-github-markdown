import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";
import type { VisualBaseline } from "../../../scripts/parity/baseline";
import type { ScreenshotComparison } from "../../../scripts/parity/visual";
import { parityCases } from "../../../scripts/parity/cases";
import {
  collectThreeWayReport,
  createReportVariants,
  type ThreeWayDependencies
} from "../../../scripts/parity/three-way";

vi.mock("vscode", () => ({ l10n: { t: (message: string) => message } }));

const selectedCases = parityCases.filter(({ id }) => id === "stress-light" || id === "stress-dark");
const baseline: VisualBaseline = {
  version: 2,
  generatedAt: "2026-07-26T00:00:00.000Z",
  chromiumVersion: "test",
  rendererSha256: "a".repeat(64),
  referenceCssSha256: "b".repeat(64),
  cases: Object.fromEntries(
    selectedCases.map((parityCase) => [
      parityCase.id,
      {
        markdownSha256: "a".repeat(64),
        inputSha256: "b".repeat(64),
        theme: parityCase.theme,
        themeName: parityCase.themeName,
        linkUnderlines: parityCase.linkUnderlines,
        reference: parityCase.reference,
        htmlNormalization: parityCase.htmlNormalization,
        localComparison: parityCase.localComparison,
        githubHtml: `<p>${parityCase.id} baseline</p>`
      }
    ])
  )
};

describe("three-way parity report", () => {
  it("covers nine themes with focused narrow and wide variants without a cartesian product", () => {
    const variants = createReportVariants(parityCases);
    const themes = new Set(
      variants
        .filter(
          ({ id }) =>
            id === "formatting-light" || id === "formatting-dark" || id.startsWith("theme-")
        )
        .map(({ source }) => source.themeName)
    );

    expect(themes.size).toBe(9);
    expect(
      variants
        .filter(({ viewport }) => viewport === "narrow")
        .map(({ id, interaction }) => ({ id, interaction }))
    ).toEqual([
      { id: "stress-light-narrow-focus", interaction: "focus" },
      { id: "stress-dark-narrow-hover", interaction: "hover" }
    ]);
    expect(variants.filter(({ viewport }) => viewport === "wide")).toHaveLength(parityCases.length);
  });

  it("reports all three comparisons independently", async () => {
    const report = await collectThreeWayReport(
      selectedCases,
      dependencies(() => comparison(0))
    );

    expect(report.conclusion).toBe("pass");
    expect(report.stages).toEqual({
      fetch: { status: "pass" },
      extract: { status: "pass" },
      render: { status: "pass" },
      compare: { status: "pass" }
    });
    expect(Object.values(report.comparisons).map((results) => results.length)).toEqual([4, 4, 4]);
    expect(
      report.comparisons["current-extension-vs-current-github"].every(
        ({ policy }) => policy.kind === "exact" && policy.owner === "extension"
      )
    ).toBe(true);
  });

  it("distinguishes upstream drift with user impact from an extension regression", async () => {
    const upstream = await collectThreeWayReport(
      selectedCases,
      dependencies((expected, actual) => {
        const pair = `${expected.toString()}|${actual.toString()}`;
        return comparison(
          pair.includes("baseline-github|") && pair.includes("current-extension") ? 0 : 1
        );
      })
    );
    const regression = await collectThreeWayReport(
      selectedCases,
      dependencies((expected, actual) =>
        comparison(
          expected.toString().includes("baseline-github") &&
            actual.toString().includes("current-github")
            ? 0
            : 1
        )
      )
    );

    expect(upstream.conclusion).toBe("upstream-drift-with-user-impact");
    expect(regression.conclusion).toBe("extension-regression");
  });

  it("records HTTP fetch and extraction failures before later stages run", async () => {
    const fetchFailure = await collectThreeWayReport(selectedCases, {
      ...dependencies(() => comparison(0)),
      fetchCurrentGithub: async () => {
        throw new Error("GitHub Markdown API returned 503");
      }
    });
    const extractFailure = await collectThreeWayReport(selectedCases, {
      ...dependencies(() => comparison(0)),
      extractInputs: async () => {
        throw new Error("CSS extractor contract failed");
      }
    });

    expect(fetchFailure).toMatchObject({
      conclusion: "fetch-failure",
      stages: {
        fetch: { status: "fail", error: { message: "GitHub Markdown API returned 503" } },
        extract: { status: "pending" }
      }
    });
    expect(extractFailure).toMatchObject({
      conclusion: "extract-failure",
      stages: {
        fetch: { status: "pass" },
        extract: { status: "fail", error: { message: "CSS extractor contract failed" } },
        render: { status: "pending" }
      }
    });
  });

  it("records render and compare failures while retaining available image artifacts", async () => {
    const renderFailure = await collectThreeWayReport(selectedCases, {
      ...dependencies(() => comparison(0)),
      render: async () => {
        throw new Error("Playwright browser failed");
      }
    });
    const written: string[] = [];
    const compareFailure = await collectThreeWayReport(selectedCases, {
      ...dependencies(() => {
        throw new Error("pixel comparison failed");
      }),
      writeArtifact: async (name) => {
        written.push(name);
      }
    });

    expect(renderFailure).toMatchObject({
      conclusion: "render-failure",
      stages: { render: { status: "fail" }, compare: { status: "pending" } }
    });
    expect(compareFailure).toMatchObject({
      conclusion: "compare-failure",
      stages: { render: { status: "pass" }, compare: { status: "fail" } }
    });
    expect(written.filter((name) => !name.includes("-diff.png"))).toHaveLength(12);
  });

  it("keeps extension-owned regions exact and documents isolated boundary ownership", async () => {
    const boundaryCase = parityCases.find(({ id }) => id === "corpus-11-light")!;
    const cases = [...selectedCases, boundaryCase];
    const report = await collectThreeWayReport(
      cases,
      dependencies(() => comparison(0), cases)
    );
    const boundary = report.comparisons["current-extension-vs-current-github"].find(
      ({ id }) => id === boundaryCase.id
    );

    expect(boundary?.policy).toMatchObject({
      kind: "integration-boundary",
      scope: "separate-fixture",
      owner: "GitHub client renderers and companion extensions"
    });
    expect(
      report.comparisons["current-extension-vs-current-github"]
        .filter(({ sourceCaseId }) => sourceCaseId.startsWith("stress-"))
        .every(
          ({ policy }) =>
            policy.kind === "exact" &&
            policy.limits.pixels === 0 &&
            policy.limits.pixelRatio === 0 &&
            policy.limits.areaPixels === 0
        )
    ).toBe(true);
  });
});

function dependencies(
  compare: ThreeWayDependencies["compare"],
  cases = selectedCases
): ThreeWayDependencies {
  return {
    fetchCurrentGithub: async () =>
      Object.fromEntries(
        cases.map((parityCase) => [parityCase.id, `<p>${parityCase.id} current GitHub</p>`])
      ),
    extractInputs: async () => ({
      baseline: cases === selectedCases ? baseline : baselineFor(cases),
      committedReferenceCss: "baseline css",
      currentGithubCss: "current GitHub css",
      currentExtensionCss: "current extension css"
    }),
    render: async (requests) => ({
      chromiumVersion: "test",
      screenshots: Object.fromEntries(
        requests.map(({ id }) => [id, Buffer.from(id.replace(/^.*?(baseline|current)/, "$1"))])
      )
    }),
    compare,
    writeArtifact: async () => {}
  };
}

function baselineFor(cases: typeof parityCases): VisualBaseline {
  return {
    ...baseline,
    cases: Object.fromEntries(
      cases.map((parityCase) => [
        parityCase.id,
        {
          markdownSha256: "a".repeat(64),
          inputSha256: "b".repeat(64),
          theme: parityCase.theme,
          themeName: parityCase.themeName,
          linkUnderlines: parityCase.linkUnderlines,
          reference: parityCase.reference,
          htmlNormalization: parityCase.htmlNormalization,
          localComparison: parityCase.localComparison,
          githubHtml: `<p>${parityCase.id} baseline</p>`
        }
      ])
    )
  };
}

function comparison(diffPixels: number): ScreenshotComparison {
  return {
    width: 1,
    height: 1,
    diffPixels,
    diffPixelRatio: diffPixels,
    largestDiffAreaPixels: diffPixels,
    diff: Buffer.from("diff")
  };
}
