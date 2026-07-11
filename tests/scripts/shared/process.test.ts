import { describe, expect, it } from "vitest";
import { runCommand } from "../../../scripts/shared/process";

describe("runCommand", () => {
  it("resolves when a child process exits successfully", async () => {
    await expect(
      runCommand(process.execPath, ["--eval", "process.exit(0)"], { stdio: "ignore" })
    ).resolves.toBeUndefined();
  });

  it("rejects with the command and exit code", async () => {
    await expect(
      runCommand(process.execPath, ["--eval", "process.exit(7)"], { stdio: "ignore" })
    ).rejects.toThrow(`${process.execPath} exited with code 7`);
  });
});
