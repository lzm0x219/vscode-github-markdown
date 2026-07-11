import { spawn, type ChildProcess, type StdioOptions } from "node:child_process";
import { join } from "node:path";
import { project } from "./project";

type RunOptions = {
  cwd?: string;
  stdio?: StdioOptions;
};

export function localBinary(name: string): string {
  const executable = process.platform === "win32" ? `${name}.cmd` : name;
  return join(project.root, "node_modules", ".bin", executable);
}

export async function runLocalBinary(name: string, args: readonly string[] = []): Promise<void> {
  await runCommand(localBinary(name), args);
}

export async function runCommand(
  command: string,
  args: readonly string[] = [],
  options: RunOptions = {}
): Promise<void> {
  const child = spawn(command, args, {
    cwd: options.cwd ?? project.root,
    stdio: options.stdio ?? "inherit"
  });
  const exitCode = await waitForChild(child);
  if (exitCode !== 0) throw new Error(`${command} exited with code ${exitCode ?? "unknown"}`);
}

export function waitForChild(child: ChildProcess): Promise<number | null> {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
}
