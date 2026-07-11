import { describe, expect, it } from "vitest";
import { shouldOpenVisualizer } from "../../../scripts/build/options";

describe("shouldOpenVisualizer", () => {
  it("disables the visualizer by default", () => {
    expect(shouldOpenVisualizer([])).toBe(false);
  });

  it("enables the visualizer with --open-visualizer", () => {
    expect(shouldOpenVisualizer(["--open-visualizer"])).toBe(true);
  });

  it("ignores arguments intended for the command runner", () => {
    expect(shouldOpenVisualizer(["--", "--open-visualizer"])).toBe(true);
  });
});
