import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildCss } from "../build/css";
import { writeTextIfChanged } from "../shared/files";
import { project } from "../shared/project";
import {
  createBaseline,
  baselineInputSha256,
  parseBaseline,
  sha256,
  validateBaseline,
  type VisualBaseline
} from "./baseline";
import {
  captureScreenshots,
  createReferenceCss,
  readLocalCss,
  visualRenderConfiguration
} from "./browser";
import { parityCases, type VisualParityCase } from "./cases";
import { renderGitHubMarkdown, renderGitHubRepositoryFile, resolveGitHubRef } from "./github";
import { stripPlatformWrapperMarkup, stripSyntaxTokenMarkup } from "./html";
import { renderLocalMarkdown } from "./local";
import { artifactNames, screenshotKeys } from "./names";
import { compareScreenshots } from "./visual";

type CaseReport = {
  id: string;
  passed: boolean;
  status: "pass" | "fail" | "integration-boundary";
  note?: string;
  width: number;
  height: number;
  diffPixels: number;
  diffPixelRatio: number;
  largestDiffAreaPixels: number;
  limits: { pixels: number; pixelRatio: number; areaPixels: number };
  artifacts: { expected: string; actual: string; diff: string };
};

type ComparisonMetrics = {
  diffPixels: number;
  diffPixelRatio: number;
  largestDiffAreaPixels: number;
};

type ComparisonLimits = { pixels: number; pixelRatio: number; areaPixels: number };

export function evaluateComparison(
  comparison: ComparisonMetrics,
  limits: ComparisonLimits,
  boundaryReason?: string
): Pick<CaseReport, "passed" | "status" | "note"> {
  const passed =
    comparison.diffPixels <= limits.pixels &&
    comparison.diffPixelRatio <= limits.pixelRatio &&
    comparison.largestDiffAreaPixels <= limits.areaPixels;
  return {
    passed,
    status: passed ? (boundaryReason ? "integration-boundary" : "pass") : "fail",
    ...(boundaryReason ? { note: boundaryReason } : {})
  };
}

export async function runParityCommand(command = process.argv[2] ?? "check"): Promise<void> {
  if (command === "refresh") return refreshBaseline();
  if (command === "sync") return syncBaseline();
  if (command === "remote") return checkVisualParity("github");
  if (command === "check") return checkVisualParity("local");
  throw new Error(`Unknown parity command: ${command}. Expected check, remote, refresh, or sync.`);
}

async function checkVisualParity(actualSource: "github" | "local"): Promise<void> {
  await buildCss();
  const [baseline, referenceCss, localCss] = await Promise.all([
    readBaseline(),
    readFile(project.paths.parityReferenceCss, "utf8"),
    actualSource === "local" ? readLocalCss() : Promise.resolve("")
  ]);
  validateBaseline(baseline, parityCases, referenceCss, visualRenderConfiguration);
  const currentGitHub =
    actualSource === "github"
      ? await renderAllGitHubCases(await resolveRepositoryReferences(parityCases))
      : undefined;
  const currentReferenceCss = actualSource === "github" ? await createReferenceCss() : undefined;
  const requests = parityCases.flatMap((parityCase) => {
    const keys = screenshotKeys(parityCase.id);
    const githubHtml = baseline.cases[parityCase.id]?.githubHtml;
    if (!githubHtml) throw new Error(`Missing or empty GitHub HTML for ${parityCase.id}`);
    const actualHtml =
      actualSource === "github"
        ? currentGitHub?.[parityCase.id]
        : renderLocalMarkdown(parityCase.markdown);
    if (!actualHtml) throw new Error(`Missing current ${actualSource} output for ${parityCase.id}`);
    return [
      {
        id: keys.reference,
        html: normalizeHtml(githubHtml, parityCase.htmlNormalization),
        css: referenceCss,
        theme: parityCase.theme,
        themeName: parityCase.themeName,
        linkUnderlines: parityCase.linkUnderlines
      },
      {
        id: keys.current,
        html: normalizeHtml(actualHtml, parityCase.htmlNormalization),
        css: actualSource === "github" ? (currentReferenceCss ?? "") : localCss,
        theme: parityCase.theme,
        themeName: parityCase.themeName,
        linkUnderlines: parityCase.linkUnderlines
      }
    ];
  });
  const { chromiumVersion, screenshots } = await captureScreenshots(requests);
  const artifactDirectory = join(project.root, "artifacts", "parity");
  await mkdir(artifactDirectory, { recursive: true });

  const reports: CaseReport[] = [];
  for (const parityCase of parityCases) {
    const keys = screenshotKeys(parityCase.id);
    const artifacts = artifactNames(parityCase.id, actualSource);
    const expected = screenshots[keys.reference];
    const actual = screenshots[keys.current];
    if (!expected || !actual) throw new Error(`Missing screenshot for ${parityCase.id}`);
    const comparison = compareScreenshots(expected, actual);
    const limits =
      actualSource === "github"
        ? { pixels: 0, pixelRatio: 0, areaPixels: 0 }
        : {
            pixels: parityCase.maxDiffPixels,
            pixelRatio: parityCase.maxDiffPixelRatio,
            areaPixels: parityCase.maxDiffAreaPixels
          };
    const boundaryComparison =
      actualSource === "local" && parityCase.localComparison.kind === "integration-boundary"
        ? parityCase.localComparison
        : undefined;
    const evaluation = evaluateComparison(comparison, limits, boundaryComparison?.reason);
    reports.push({
      id: parityCase.id,
      ...evaluation,
      width: comparison.width,
      height: comparison.height,
      diffPixels: comparison.diffPixels,
      diffPixelRatio: comparison.diffPixelRatio,
      largestDiffAreaPixels: comparison.largestDiffAreaPixels,
      limits,
      artifacts
    });
    await Promise.all([
      writeFile(join(artifactDirectory, artifacts.expected), expected),
      writeFile(join(artifactDirectory, artifacts.actual), actual),
      writeFile(join(artifactDirectory, artifacts.diff), comparison.diff)
    ]);
  }

  const actualCss = actualSource === "github" ? (currentReferenceCss ?? "") : localCss;
  await writeReports(
    artifactDirectory,
    actualSource,
    baseline,
    chromiumVersion,
    sha256(actualCss),
    reports
  );
  for (const report of reports) {
    console.log(
      `${report.id}: ${report.diffPixels}px, ${(report.diffPixelRatio * 100).toFixed(4)}%, largest area ${report.largestDiffAreaPixels}px (${report.status})`
    );
  }
  if (reports.some(({ passed }) => !passed)) {
    throw new Error(`Visual parity exceeded its limits. See ${artifactDirectory}`);
  }
}

function normalizeHtml(html: string, normalization: "none" | "syntax-tokens"): string {
  const withoutPlatformWrappers = stripPlatformWrapperMarkup(html);
  return normalization === "syntax-tokens"
    ? stripSyntaxTokenMarkup(withoutPlatformWrappers)
    : withoutPlatformWrappers;
}

async function refreshBaseline(): Promise<void> {
  const resolvedCases = await resolveRepositoryReferences(parityCases);
  const [githubHtml, referenceCss, browser] = await Promise.all([
    renderAllGitHubCases(resolvedCases),
    createReferenceCss(),
    captureScreenshots([])
  ]);
  const baseline = createBaseline(
    resolvedCases,
    githubHtml,
    referenceCss,
    visualRenderConfiguration,
    {
      chromiumVersion: browser.chromiumVersion
    }
  );
  const [baselineResult, cssResult] = await Promise.all([
    writeTextIfChanged(project.paths.parityBaseline, `${JSON.stringify(baseline, null, 2)}\n`),
    writeTextIfChanged(project.paths.parityReferenceCss, referenceCss)
  ]);
  console.log(`Visual parity baseline ${baselineResult}; reference CSS ${cssResult}`);
}

async function syncBaseline(): Promise<void> {
  const [current, referenceCss, browser] = await Promise.all([
    readBaseline(),
    createReferenceCss(),
    captureScreenshots([])
  ]);
  const htmlByInput = new Map(
    Object.values(current.cases).map(({ inputSha256, githubHtml }) => [inputSha256, githubHtml])
  );
  const synchronizedCases = parityCases.map((parityCase) => {
    const storedReference = current.cases[parityCase.id]?.reference;
    return parityCase.reference.kind === "repository-file" &&
      storedReference?.kind === "repository-file"
      ? { ...parityCase, reference: storedReference }
      : parityCase;
  });
  const githubHtml = Object.fromEntries(
    synchronizedCases.map((parityCase) => {
      const { id } = parityCase;
      const html = htmlByInput.get(baselineInputSha256(parityCase));
      if (!html) {
        throw new Error(
          `No verified GitHub HTML matches ${id}; run update:parity with network access`
        );
      }
      return [id, html];
    })
  );
  const baseline = createBaseline(
    synchronizedCases,
    githubHtml,
    referenceCss,
    visualRenderConfiguration,
    { chromiumVersion: browser.chromiumVersion }
  );
  await Promise.all([
    writeTextIfChanged(project.paths.parityBaseline, `${JSON.stringify(baseline, null, 2)}\n`),
    writeTextIfChanged(project.paths.parityReferenceCss, referenceCss)
  ]);
  console.log("Visual parity baseline synchronized from verified matching Markdown inputs");
}

export async function resolveRepositoryReferences(
  cases: readonly VisualParityCase[],
  resolveRef = resolveGitHubRef
): Promise<readonly VisualParityCase[]> {
  const refs = [
    ...new Set(
      cases.flatMap(({ reference }) =>
        reference.kind === "repository-file" ? [`${reference.repository}\0${reference.ref}`] : []
      )
    )
  ];
  const resolved = new Map(
    await Promise.all(
      refs.map(async (key) => {
        const [repository, ref] = key.split("\0") as [string, string];
        return [key, await resolveRef(ref, fetch, repository)] as const;
      })
    )
  );
  return cases.map((parityCase) =>
    parityCase.reference.kind === "repository-file"
      ? {
          ...parityCase,
          reference: {
            ...parityCase.reference,
            ref:
              resolved.get(`${parityCase.reference.repository}\0${parityCase.reference.ref}`) ??
              parityCase.reference.ref
          }
        }
      : parityCase
  );
}

export async function renderAllGitHubCases(
  cases = parityCases,
  renderMarkdown = renderGitHubMarkdown,
  renderRepositoryFile = renderGitHubRepositoryFile
): Promise<Record<string, string>> {
  const renderedByMarkdown = new Map<string, string>();
  const apiCases = cases.filter(({ reference }) => reference.kind === "markdown-api");
  const uniqueMarkdown = [...new Set(apiCases.map(({ markdown }) => markdown))];
  for (let index = 0; index < uniqueMarkdown.length; index += 4) {
    const batch = uniqueMarkdown.slice(index, index + 4);
    const rendered = await Promise.all(batch.map((markdown) => renderMarkdown(markdown)));
    for (const [batchIndex, html] of rendered.entries()) {
      const markdown = batch[batchIndex];
      if (markdown !== undefined) renderedByMarkdown.set(markdown, html);
    }
  }
  const repositoryCases = cases.filter(
    (
      parityCase
    ): parityCase is typeof parityCase & {
      reference: {
        kind: "repository-file";
        repository: string;
        path: string;
        ref: string;
      };
    } => parityCase.reference.kind === "repository-file"
  );
  const repositoryGroups = new Map<
    string,
    { repository: string; path: string; ref: string; markdown: string; ids: string[] }
  >();
  for (const { id, markdown, reference } of repositoryCases) {
    const key = `${reference.repository}\0${reference.ref}\0${reference.path}`;
    const group = repositoryGroups.get(key);
    if (group) {
      if (group.markdown !== markdown) {
        throw new Error(`Conflicting local Markdown for repository file ${reference.path}`);
      }
      group.ids.push(id);
    } else {
      repositoryGroups.set(key, { ...reference, markdown, ids: [id] });
    }
  }
  const repositoryFiles: Array<readonly [string, string]> = [];
  const uniqueRepositoryFiles = [...repositoryGroups.values()];
  for (let index = 0; index < uniqueRepositoryFiles.length; index += 4) {
    const batch = uniqueRepositoryFiles.slice(index, index + 4);
    const rendered = await Promise.all(
      batch.map(({ repository, path, markdown, ref }) =>
        renderRepositoryFile(path, markdown, fetch, ref, repository)
      )
    );
    for (const [batchIndex, html] of rendered.entries()) {
      for (const id of batch[batchIndex]?.ids ?? []) repositoryFiles.push([id, html]);
    }
  }
  return Object.fromEntries([
    ...apiCases.map(({ id, markdown }) => {
      const html = renderedByMarkdown.get(markdown);
      if (!html) throw new Error(`Missing GitHub rendering for ${id}`);
      return [id, html];
    }),
    ...repositoryFiles
  ]);
}

async function readBaseline(): Promise<VisualBaseline> {
  return parseBaseline(JSON.parse(await readFile(project.paths.parityBaseline, "utf8")) as unknown);
}

async function writeReports(
  directory: string,
  source: "github" | "local",
  baseline: VisualBaseline,
  chromiumVersion: string,
  actualCssSha256: string,
  cases: readonly CaseReport[]
): Promise<void> {
  const report = {
    source,
    baselineGeneratedAt: baseline.generatedAt,
    baselineChromiumVersion: baseline.chromiumVersion,
    chromiumVersion,
    referenceCssSha256: baseline.referenceCssSha256,
    actualCssSha256,
    cases
  };
  const markdown = [
    "# Markdown visual parity",
    "",
    `Source: ${source}`,
    `Baseline: ${baseline.generatedAt}`,
    `Chromium: ${chromiumVersion}`,
    "",
    "| Case | Result | Pixels | Ratio | Largest area | Artifacts |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...cases.map(
      (item) =>
        `| ${item.id} | ${item.status === "integration-boundary" ? `Boundary: ${item.note}` : item.passed ? "Pass" : "Fail"} | ${item.diffPixels}/${item.limits.pixels} | ${(item.diffPixelRatio * 100).toFixed(4)}%/${(item.limits.pixelRatio * 100).toFixed(4)}% | ${item.largestDiffAreaPixels}/${item.limits.areaPixels} | [expected](${item.artifacts.expected}) · [actual](${item.artifacts.actual}) · [diff](${item.artifacts.diff}) |`
    ),
    ""
  ].join("\n");
  await Promise.all([
    writeFile(join(directory, "report.json"), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(join(directory, "report.md"), markdown)
  ]);
}
