import { describe, expect, it } from "vitest";
import { parityCases } from "../../../scripts/parity/cases";

describe("visual parity cases", () => {
  it("covers each visual feature in light and dark mode with zero tolerance", () => {
    const features = [
      "formatting",
      "tagfilter",
      "directionality",
      "lists",
      "alerts",
      "emoji",
      "footnotes",
      "links",
      "links-hidden",
      "code-blocks",
      "platform-layout",
      "details",
      "html-elements",
      "stress"
    ];

    expect(
      parityCases
        .filter(({ id }) => !id.startsWith("theme-") && !id.startsWith("corpus-"))
        .map(({ id }) => id)
    ).toEqual(features.flatMap((feature) => [`${feature}-light`, `${feature}-dark`]));
    expect(
      parityCases
        .filter(({ localComparison }) => localComparison.kind === "exact")
        .every(
          ({ maxDiffPixels, maxDiffPixelRatio, maxDiffAreaPixels }) =>
            maxDiffPixels === 0 && maxDiffPixelRatio === 0 && maxDiffAreaPixels === 0
        )
    ).toBe(true);

    expect(parityCases.filter(({ id }) => id.startsWith("theme-")).map(({ id }) => id)).toEqual([
      "theme-light_colorblind",
      "theme-light_high_contrast",
      "theme-light_tritanopia",
      "theme-dark_colorblind",
      "theme-dark_dimmed",
      "theme-dark_high_contrast",
      "theme-dark_tritanopia"
    ]);

    expect(
      parityCases
        .filter(({ localComparison }) => localComparison.kind === "integration-boundary")
        .map(({ id }) => id)
    ).toEqual([
      "corpus-03-host-highlighting-light",
      "corpus-03-host-highlighting-dark",
      "corpus-11-light",
      "corpus-11-dark"
    ]);
    expect(
      parityCases
        .filter(({ localComparison }) => localComparison.kind === "integration-boundary")
        .every(
          ({ maxDiffPixels, maxDiffPixelRatio, maxDiffAreaPixels }) =>
            maxDiffPixels > 0 && maxDiffPixelRatio > 0 && maxDiffAreaPixels > 0
        )
    ).toBe(true);

    expect(
      parityCases
        .filter(({ htmlNormalization }) => htmlNormalization === "syntax-tokens")
        .map(({ id }) => id)
    ).toEqual(["corpus-03-light", "corpus-03-dark"]);
  });
});
