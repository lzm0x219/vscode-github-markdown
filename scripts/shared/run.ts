import { $ } from "bun";
import { localExecutable } from "./paths";

export async function runLocalExecutable(name: string, args: string[] = []): Promise<void> {
  await $`${localExecutable(name)} ${args.join(" ")}`;
}

export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB`;
}
