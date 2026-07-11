import { describe, expect, it } from "vitest";
import { createBaseline, parseBaseline, validateBaseline } from "../../../scripts/parity/baseline";

const cases = [
  {
    id: "formatting-light",
    markdown: "# Formatting",
    theme: "light",
    themeName: "light",
    linkUnderlines: true,
    reference: { kind: "markdown-api" as const },
    htmlNormalization: "none" as const,
    localComparison: { kind: "exact" as const }
  }
];

function baseline() {
  return createBaseline(cases, { "formatting-light": "<h1>Formatting</h1>" }, "css", "renderer", {
    chromiumVersion: "123.0",
    generatedAt: "2026-07-12T00:00:00.000Z"
  });
}

describe("visual parity baseline", () => {
  it("records input, CSS, and renderer fingerprints", () => {
    const value = baseline();

    expect(value.version).toBe(2);
    expect(value.referenceCssSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(value.rendererSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(value.cases["formatting-light"]?.markdownSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(value.cases["formatting-light"]?.reference).toEqual({ kind: "markdown-api" });
    expect(() => validateBaseline(value, cases, "css", "renderer")).not.toThrow();
  });

  it("rejects stale inputs and case ids", () => {
    const value = baseline();

    expect(() =>
      validateBaseline(value, [{ ...cases[0]!, markdown: "# Changed" }], "css", "renderer")
    ).toThrow("Markdown input changed for formatting-light");
    expect(() => validateBaseline(value, cases, "changed css", "renderer")).toThrow(
      "Reference CSS fingerprint does not match"
    );
    expect(() => validateBaseline(value, cases, "css", "changed renderer")).toThrow(
      "Renderer configuration fingerprint does not match"
    );
    expect(() =>
      validateBaseline(value, [{ ...cases[0]!, theme: "dark" }], "css", "renderer")
    ).toThrow("Theme input changed for formatting-light");
    expect(() =>
      validateBaseline(value, [{ ...cases[0]!, themeName: "light_dimmed" }], "css", "renderer")
    ).toThrow("Theme name input changed for formatting-light");
    expect(() =>
      validateBaseline(value, [{ ...cases[0]!, linkUnderlines: false }], "css", "renderer")
    ).toThrow("Link underline input changed for formatting-light");
    expect(() =>
      validateBaseline(
        value,
        [
          {
            ...cases[0]!,
            reference: {
              kind: "repository-file",
              repository: "owner/repository",
              path: "a.md",
              ref: "a".repeat(40)
            }
          }
        ],
        "css",
        "renderer"
      )
    ).toThrow("Reference input changed for formatting-light");
    expect(() =>
      validateBaseline(
        value,
        [{ ...cases[0]!, htmlNormalization: "syntax-tokens" }],
        "css",
        "renderer"
      )
    ).toThrow("HTML normalization changed for formatting-light");
    expect(() =>
      validateBaseline(value, [...cases, { ...cases[0]!, id: "missing" }], "css", "renderer")
    ).toThrow("Baseline case ids do not match: missing missing");
    expect(() =>
      validateBaseline(
        { ...value, cases: { ...value.cases, stale: value.cases["formatting-light"]! } },
        cases,
        "css",
        "renderer"
      )
    ).toThrow("Baseline case ids do not match: stale stale");
  });

  it("rejects duplicate case ids", () => {
    expect(() =>
      createBaseline(
        [...cases, { ...cases[0]! }],
        { "formatting-light": "html" },
        "css",
        "renderer",
        { chromiumVersion: "123.0" }
      )
    ).toThrow("Duplicate visual parity case id: formatting-light");
  });

  it("rejects malformed baseline data at the file boundary", () => {
    expect(() => parseBaseline(null)).toThrow("Visual baseline must be an object");
    expect(() => parseBaseline({ version: 1 })).toThrow("Visual baseline metadata is invalid");
    expect(() => parseBaseline({ ...baseline(), cases: { broken: { githubHtml: 1 } } })).toThrow(
      "Visual baseline case is invalid: broken"
    );
    const missingThemeName = { ...baseline().cases["formatting-light"]! } as Record<
      string,
      unknown
    >;
    delete missingThemeName["themeName"];
    expect(() =>
      parseBaseline({ ...baseline(), cases: { "formatting-light": missingThemeName } })
    ).toThrow("Visual baseline case is invalid: formatting-light");
    const missingLinkUnderlines = { ...baseline().cases["formatting-light"]! } as Record<
      string,
      unknown
    >;
    delete missingLinkUnderlines["linkUnderlines"];
    expect(() =>
      parseBaseline({ ...baseline(), cases: { "formatting-light": missingLinkUnderlines } })
    ).toThrow("Visual baseline case is invalid: formatting-light");
  });

  it("treats repository and commit SHA as provenance rather than case identity", () => {
    const repositoryCase = {
      ...cases[0]!,
      reference: {
        kind: "repository-file" as const,
        repository: "owner/repository",
        path: "fixture.md",
        ref: "a".repeat(40)
      }
    };
    const value = createBaseline(
      [repositoryCase],
      { "formatting-light": "<p>fixture</p>" },
      "css",
      "renderer",
      { chromiumVersion: "123.0" }
    );

    expect(() =>
      validateBaseline(
        value,
        [
          {
            ...repositoryCase,
            reference: {
              ...repositoryCase.reference,
              repository: "contributor/fork",
              ref: "main"
            }
          }
        ],
        "css",
        "renderer"
      )
    ).not.toThrow();
  });

  it("rejects mutable refs, malformed repositories, and unsafe paths in stored baselines", () => {
    const repositoryCase = {
      ...cases[0]!,
      reference: {
        kind: "repository-file" as const,
        repository: "owner/repository",
        path: "fixture.md",
        ref: "a".repeat(40)
      }
    };
    const value = createBaseline(
      [repositoryCase],
      { "formatting-light": "<p>fixture</p>" },
      "css",
      "renderer",
      { chromiumVersion: "123.0" }
    );

    const mutableRef = {
      ...value.cases["formatting-light"]!,
      reference: { ...repositoryCase.reference, ref: "main" }
    };
    expect(() => parseBaseline({ ...value, cases: { "formatting-light": mutableRef } })).toThrow(
      "Visual baseline case is invalid: formatting-light"
    );
    const malformedRepository = {
      ...value.cases["formatting-light"]!,
      reference: { ...repositoryCase.reference, repository: "not-a-repository" }
    };
    expect(() =>
      parseBaseline({ ...value, cases: { "formatting-light": malformedRepository } })
    ).toThrow("Visual baseline case is invalid: formatting-light");
    const unsafePath = {
      ...value.cases["formatting-light"]!,
      reference: { ...repositoryCase.reference, path: "fixtures/../secret.md" }
    };
    expect(() => parseBaseline({ ...value, cases: { "formatting-light": unsafePath } })).toThrow(
      "Visual baseline case is invalid: formatting-light"
    );
  });

  it("rejects old baselines whose complete case identity was not recorded", () => {
    expect(() => parseBaseline({ ...baseline(), version: 1 })).toThrow(
      "Unsupported visual baseline version"
    );
  });
});
