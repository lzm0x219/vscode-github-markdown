import { transform } from "lightningcss";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { buildPreviewCss } from "../../../scripts/build/preview-css";

describe("preview CSS browser compatibility", () => {
  it("emits flat style rules for the minimum supported VS Code renderer", async () => {
    const { path } = await buildPreviewCss();
    let nestedRuleCount = 0;
    transform({
      filename: path,
      code: await readFile(path),
      visitor: {
        Rule(rule) {
          if (rule.type === "style") nestedRuleCount += rule.value.rules?.length ?? 0;
        }
      }
    });

    expect(nestedRuleCount).toBe(0);
  });
});
