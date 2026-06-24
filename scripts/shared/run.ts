import { spawn } from "node:child_process";
import { localExecutable } from "./paths";

export async function runLocalExecutable(name: string, args: string[] = []): Promise<void> {
  await runCommand(localExecutable(name), args);
}

export async function runCommand(command: string, args: string[] = []): Promise<void> {
  const child = spawn(command, args, { stdio: "inherit" });
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`${command} exited with code ${exitCode ?? "unknown"}`);
  }
}

export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB`;
}
