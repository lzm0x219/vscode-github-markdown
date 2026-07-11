import { createHash } from "node:crypto";
import { isGitHubRepository, isRepositoryPath } from "./repository";

export type BaselineCaseInput = {
  id: string;
  markdown: string;
  theme?: string;
  themeName?: string;
  linkUnderlines?: boolean;
  reference: BaselineReference;
  htmlNormalization: "none" | "syntax-tokens";
  localComparison: { kind: "exact" } | { kind: "integration-boundary"; reason: string };
};

export type BaselineReference =
  | { kind: "markdown-api" }
  | { kind: "repository-file"; repository: string; path: string; ref: string };

export type VisualBaseline = {
  version: number;
  generatedAt: string;
  chromiumVersion: string;
  rendererSha256: string;
  referenceCssSha256: string;
  cases: Record<
    string,
    {
      markdownSha256: string;
      inputSha256: string;
      theme: string | null;
      themeName: string | null;
      linkUnderlines: boolean;
      reference: BaselineReference;
      htmlNormalization: "none" | "syntax-tokens";
      localComparison: BaselineCaseInput["localComparison"];
      githubHtml: string;
    }
  >;
};

export function parseBaseline(value: unknown): VisualBaseline {
  if (!isRecord(value)) throw new Error("Visual baseline must be an object");
  if (
    typeof value["version"] !== "number" ||
    typeof value["generatedAt"] !== "string" ||
    typeof value["chromiumVersion"] !== "string" ||
    typeof value["rendererSha256"] !== "string" ||
    typeof value["referenceCssSha256"] !== "string" ||
    !isRecord(value["cases"])
  ) {
    throw new Error("Visual baseline metadata is invalid");
  }
  if (value["version"] !== 2) {
    throw new Error(`Unsupported visual baseline version: ${value["version"]}`);
  }
  for (const [id, parityCase] of Object.entries(value["cases"])) {
    if (
      !isRecord(parityCase) ||
      typeof parityCase["markdownSha256"] !== "string" ||
      typeof parityCase["inputSha256"] !== "string" ||
      (parityCase["theme"] !== null && typeof parityCase["theme"] !== "string") ||
      (parityCase["themeName"] !== null && typeof parityCase["themeName"] !== "string") ||
      typeof parityCase["linkUnderlines"] !== "boolean" ||
      !isBaselineReference(parityCase["reference"]) ||
      (parityCase["htmlNormalization"] !== "none" &&
        parityCase["htmlNormalization"] !== "syntax-tokens") ||
      !isLocalComparison(parityCase["localComparison"]) ||
      typeof parityCase["githubHtml"] !== "string"
    ) {
      throw new Error(`Visual baseline case is invalid: ${id}`);
    }
  }
  return value as VisualBaseline;
}

export function createBaseline(
  cases: readonly BaselineCaseInput[],
  githubHtml: Readonly<Record<string, string>>,
  referenceCss: string,
  rendererConfiguration: string,
  metadata: { chromiumVersion: string; generatedAt?: string }
): VisualBaseline {
  assertUniqueCaseIds(cases);
  return {
    version: 2,
    generatedAt: metadata.generatedAt ?? new Date().toISOString(),
    chromiumVersion: metadata.chromiumVersion,
    rendererSha256: sha256(rendererConfiguration),
    referenceCssSha256: sha256(referenceCss),
    cases: Object.fromEntries(
      cases.map((parityCase) => {
        const { id, markdown, theme, themeName, linkUnderlines } = parityCase;
        const html = githubHtml[id];
        if (!html) throw new Error(`Missing or empty GitHub HTML for ${id}`);
        return [
          id,
          {
            markdownSha256: sha256(markdown),
            inputSha256: baselineInputSha256(parityCase),
            theme: theme ?? null,
            themeName: themeName ?? theme ?? null,
            linkUnderlines: linkUnderlines ?? true,
            reference: parityCase.reference,
            htmlNormalization: parityCase.htmlNormalization,
            localComparison: parityCase.localComparison,
            githubHtml: html
          }
        ];
      })
    )
  };
}

export function validateBaseline(
  baseline: VisualBaseline,
  cases: readonly BaselineCaseInput[],
  referenceCss: string,
  rendererConfiguration: string
): void {
  if (baseline.version !== 2)
    throw new Error(`Unsupported visual baseline version: ${baseline.version}`);
  assertUniqueCaseIds(cases);
  assertMatchingCaseIds(baseline, cases);
  if (baseline.referenceCssSha256 !== sha256(referenceCss)) {
    throw new Error("Reference CSS fingerprint does not match; run update:parity");
  }
  if (baseline.rendererSha256 !== sha256(rendererConfiguration)) {
    throw new Error("Renderer configuration fingerprint does not match; run update:parity");
  }
  for (const parityCase of cases) {
    const { id, markdown, theme, themeName, linkUnderlines } = parityCase;
    const stored = baseline.cases[id];
    if (!stored?.githubHtml) throw new Error(`Missing or empty GitHub HTML for ${id}`);
    if (stored.markdownSha256 !== sha256(markdown)) {
      throw new Error(`Markdown input changed for ${id}; run update:parity`);
    }
    if (stored.theme !== (theme ?? null)) {
      throw new Error(`Theme input changed for ${id}; run update:parity`);
    }
    if (stored.themeName !== (themeName ?? theme ?? null)) {
      throw new Error(`Theme name input changed for ${id}; run update:parity`);
    }
    if (stored.linkUnderlines !== (linkUnderlines ?? true)) {
      throw new Error(`Link underline input changed for ${id}; run update:parity`);
    }
    if (
      JSON.stringify(referenceIdentity(stored.reference)) !==
      JSON.stringify(referenceIdentity(parityCase.reference))
    ) {
      throw new Error(`Reference input changed for ${id}; run update:parity`);
    }
    if (stored.htmlNormalization !== parityCase.htmlNormalization) {
      throw new Error(`HTML normalization changed for ${id}; run update:parity`);
    }
    if (JSON.stringify(stored.localComparison) !== JSON.stringify(parityCase.localComparison)) {
      throw new Error(`Local comparison changed for ${id}; run update:parity`);
    }
    if (stored.inputSha256 !== baselineInputSha256(parityCase)) {
      throw new Error(`Complete input fingerprint changed for ${id}; run update:parity`);
    }
  }
}

export function baselineInputSha256(parityCase: BaselineCaseInput): string {
  return sha256(
    JSON.stringify({
      markdown: parityCase.markdown,
      reference: referenceIdentity(parityCase.reference),
      htmlNormalization: parityCase.htmlNormalization,
      localComparison: parityCase.localComparison
    })
  );
}

function referenceIdentity(
  reference: BaselineReference
): { kind: "markdown-api" } | { kind: "repository-file"; path: string } {
  return reference.kind === "markdown-api"
    ? reference
    : { kind: "repository-file", path: reference.path };
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertUniqueCaseIds(cases: readonly BaselineCaseInput[]): void {
  const seen = new Set<string>();
  for (const { id } of cases) {
    if (seen.has(id)) throw new Error(`Duplicate visual parity case id: ${id}`);
    seen.add(id);
  }
}

function assertMatchingCaseIds(
  baseline: VisualBaseline,
  cases: readonly BaselineCaseInput[]
): void {
  const current = new Set(cases.map(({ id }) => id));
  const stored = new Set(Object.keys(baseline.cases));
  const missing = [...current].filter((id) => !stored.has(id)).sort();
  const stale = [...stored].filter((id) => !current.has(id)).sort();
  if (missing.length === 0 && stale.length === 0) return;
  const details = [
    missing.length > 0 ? `missing ${missing.join(", ")}` : "",
    stale.length > 0 ? `stale ${stale.join(", ")}` : ""
  ].filter(Boolean);
  throw new Error(`Baseline case ids do not match: ${details.join("; ")}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBaselineReference(value: unknown): value is BaselineReference {
  if (!isRecord(value)) return false;
  if (value["kind"] === "markdown-api") return true;
  return (
    value["kind"] === "repository-file" &&
    isGitHubRepository(value["repository"]) &&
    isRepositoryPath(value["path"]) &&
    /^[\da-f]{40}$/i.test(String(value["ref"]))
  );
}

function isLocalComparison(value: unknown): value is BaselineCaseInput["localComparison"] {
  if (!isRecord(value)) return false;
  return (
    value["kind"] === "exact" ||
    (value["kind"] === "integration-boundary" && typeof value["reason"] === "string")
  );
}
