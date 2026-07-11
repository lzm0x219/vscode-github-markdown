import type { GithubTheme } from "../build/github-css";
import { loadCorpusFixtures } from "./corpus";

export type VisualParityCase = {
  id: string;
  theme: "light" | "dark";
  themeName: GithubTheme;
  maxDiffPixelRatio: number;
  maxDiffPixels: number;
  maxDiffAreaPixels: number;
  linkUnderlines: boolean;
  markdown: string;
  reference:
    | { kind: "markdown-api" }
    | { kind: "repository-file"; repository: string; path: string; ref: string };
  localComparison: { kind: "exact" } | { kind: "integration-boundary"; reason: string };
  htmlNormalization: "none" | "syntax-tokens";
};

const fixtures = {
  formatting:
    "# Heading\n\n**Bold**, *italic*, ~~deleted~~, and `inline code`.\n\n> A blockquote.\n",
  lists:
    "- [x] Completed task\n- [ ] Pending task\n\n| Feature | Status |\n| --- | --- |\n| Tables | Supported |\n",
  alerts: "> [!NOTE]\n> Useful information.\n\n> [!WARNING]\n> Check this carefully.\n",
  emoji: "Unicode :rocket: :+1: :tada: and unknown :not-an-emoji:.\n",
  footnotes:
    "Reference[^1] and another reference[^1].\n\n[^1]: Detail with *emphasis* and `code`.\n",
  links:
    "[GitHub](https://github.com), <https://example.com>, and [`ROADMAP.md`](./ROADMAP.md).\n\nPress <kbd>Ctrl</kbd> + <kbd>K</kbd>.\n",
  "links-hidden":
    "[GitHub](https://github.com), <https://example.com>, and [`ROADMAP.md`](./ROADMAP.md).\n\nPress <kbd>Ctrl</kbd> + <kbd>K</kbd>.\n",
  "code-blocks":
    '```\nconst greeting = "hello";\nconsole.log(greeting);\n```\n\n    indented code\n',
  "platform-layout": [
    "# Platform features",
    "",
    "> Rendering is supplied by the host platform.",
    "",
    "## Mermaid",
    "",
    "```",
    "diagram source",
    "```",
    "",
    "## GeoJSON",
    "",
    "```",
    "map source",
    "```",
    "",
    "## STL",
    "",
    "```",
    "model source",
    "```",
    "",
    "## Math",
    "",
    "`formula source`",
    ""
  ].join("\n"),
  details:
    "<details open>\n<summary>More information</summary>\n\nHidden **Markdown** content.\n\n</details>\n",
  "html-elements":
    "Text with <sub>subscript</sub>, <sup>superscript</sup>, and <samp>sample output</samp>.\n\n<dl><dt>Term</dt><dd>Definition</dd></dl>\n",
  stress: [
    "# Heading one",
    "",
    "## Heading two",
    "",
    "### Heading three",
    "",
    "---",
    "",
    "1. Parent item",
    "   - Nested item",
    "   - [x] Linked task with [`code`](https://example.com)",
    "",
    "> [!IMPORTANT]",
    "> **Bold**, *italic*, `code`, and :shipit:.",
    "",
    "First[^first] and second[^second].",
    "",
    "[^first]: First footnote.",
    "[^second]: Second footnote with [link](https://example.com).",
    ""
  ].join("\n")
} as const;

const themes = ["light", "dark"] as const;
const repositoryRef = process.env["GITHUB_MARKDOWN_REF"]?.trim() || "main";
const repository =
  process.env["GITHUB_MARKDOWN_REPOSITORY"]?.trim() || "lzm0x219/vscode-github-markdown";
const limits = {
  formatting: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  lists: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  alerts: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  emoji: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  footnotes: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  links: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  "links-hidden": { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  "code-blocks": { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  "platform-layout": { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  details: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  "html-elements": { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 },
  stress: { maxDiffPixelRatio: 0, maxDiffPixels: 0, maxDiffAreaPixels: 0 }
} as const;

const baseCases: readonly VisualParityCase[] = Object.entries(fixtures).flatMap(
  ([name, markdown]) =>
    themes.map((theme) => ({
      id: `${name}-${theme}`,
      theme,
      themeName: theme,
      linkUnderlines: name !== "links-hidden",
      reference: { kind: "markdown-api" as const },
      localComparison: { kind: "exact" as const },
      htmlNormalization: "none" as const,
      ...limits[name as keyof typeof limits],
      markdown
    }))
);

const additionalThemes = [
  "light_colorblind",
  "light_high_contrast",
  "light_tritanopia",
  "dark_colorblind",
  "dark_dimmed",
  "dark_high_contrast",
  "dark_tritanopia"
] as const satisfies readonly GithubTheme[];

const themeCases: VisualParityCase[] = additionalThemes.map((themeName) => ({
  id: `theme-${themeName}`,
  theme: themeName.startsWith("light") ? "light" : "dark",
  themeName,
  linkUnderlines: true,
  reference: { kind: "markdown-api" },
  localComparison: { kind: "exact" },
  htmlNormalization: "none",
  maxDiffPixelRatio: 0,
  maxDiffPixels: 0,
  maxDiffAreaPixels: 0,
  markdown: fixtures.formatting
}));

const corpusIntegrationBoundaries: Readonly<
  Record<string, { kind: "integration-boundary"; reason: string }>
> = {
  "11": {
    kind: "integration-boundary",
    reason: "Mermaid, GeoJSON, STL, and math are client-side platform renderers."
  }
};

const integrationBoundaryLimits: Readonly<
  Record<string, { maxDiffPixelRatio: number; maxDiffPixels: number; maxDiffAreaPixels: number }>
> = {
  "corpus-03-host-highlighting-light": {
    maxDiffPixelRatio: 0.014,
    maxDiffPixels: 24_000,
    maxDiffAreaPixels: 5_000
  },
  "corpus-03-host-highlighting-dark": {
    maxDiffPixelRatio: 0.014,
    maxDiffPixels: 24_000,
    maxDiffAreaPixels: 5_000
  },
  "corpus-11-light": {
    maxDiffPixelRatio: 0.35,
    maxDiffPixels: 4_000_000,
    maxDiffAreaPixels: 700_000
  },
  "corpus-11-dark": {
    maxDiffPixelRatio: 0.35,
    maxDiffPixels: 4_000_000,
    maxDiffAreaPixels: 700_000
  }
};

const corpusCases: VisualParityCase[] = loadCorpusFixtures().flatMap(({ id, path, markdown }) => {
  const file = id.slice(-2);
  const cases = themes.map((theme) => {
    const caseId = `${id}-${theme}`;
    return {
      id: caseId,
      theme,
      themeName: theme,
      linkUnderlines: true,
      reference: { kind: "repository-file" as const, repository, path, ref: repositoryRef },
      localComparison: corpusIntegrationBoundaries[file] ?? { kind: "exact" as const },
      htmlNormalization: file === "03" ? ("syntax-tokens" as const) : ("none" as const),
      ...(integrationBoundaryLimits[caseId] ?? {
        maxDiffPixelRatio: 0,
        maxDiffPixels: 0,
        maxDiffAreaPixels: 0
      }),
      markdown
    };
  });
  if (file !== "03") return cases;
  return [
    ...cases,
    ...themes.map((theme, index) => {
      const caseId = `${id}-host-highlighting-${theme}`;
      return {
        ...cases[index]!,
        id: caseId,
        htmlNormalization: "none" as const,
        localComparison: {
          kind: "integration-boundary" as const,
          reason:
            "Syntax token colors are supplied by the VS Code Markdown host and differ from GitHub's token renderer."
        },
        ...integrationBoundaryLimits[caseId]!
      };
    })
  ];
});

export const parityCases: readonly VisualParityCase[] = [
  ...baseCases,
  ...corpusCases,
  ...themeCases
];
