import { describe, expect, it } from "vitest";
import {
  assertExtensionBundleDependencies,
  findUnexpectedExternalModules
} from "../../../scripts/build/extension-bundle";

describe("extension bundle dependencies", () => {
  it("allows the VS Code host dependency", () => {
    expect(findUnexpectedExternalModules('const vscode = require("vscode");')).toEqual([]);
  });

  it("reports sorted unique unexpected external modules", () => {
    const source = [
      'require("vscode")',
      'require("markdown-it")',
      "require('entities')",
      'require("entities")'
    ].join(";");

    expect(findUnexpectedExternalModules(source)).toEqual(["entities", "markdown-it"]);
  });

  it("rejects bundles with unexpected external modules", () => {
    expect(() => assertExtensionBundleDependencies('require("entities")')).toThrow(
      "Unexpected external modules in extension bundle: entities"
    );
  });
});
