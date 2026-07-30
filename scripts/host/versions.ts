export const hostVersions = {
  latestStableDesktop: "stable",
  // Pinning each host also pins its bundled Mermaid and KaTeX renderers.
  pinnedPreview: {
    desktopVersion: "1.129.0",
    webCommit: "125df4672b8a6a34975303c6b0baa124e560a4f7"
  }
} as const;
