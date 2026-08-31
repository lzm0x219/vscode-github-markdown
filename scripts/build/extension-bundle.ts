import { readFile } from "node:fs/promises";

const staticRequirePattern = /\brequire\s*\(\s*(["'])([^"']+)\1\s*\)/g;
const allowedExternalModules = new Set(["vscode"]);

export function findUnexpectedExternalModules(source: string): string[] {
  const externalModules = new Set<string>();
  for (const match of source.matchAll(staticRequirePattern)) {
    const moduleName = match[2];
    if (moduleName && !allowedExternalModules.has(moduleName)) externalModules.add(moduleName);
  }
  return [...externalModules].sort();
}

export function assertExtensionBundleDependencies(source: string): void {
  const unexpected = findUnexpectedExternalModules(source);
  if (unexpected.length === 0) return;
  throw new Error(`Unexpected external modules in extension bundle: ${unexpected.join(", ")}`);
}

export async function verifyExtensionBundle(path: string): Promise<void> {
  assertExtensionBundleDependencies(await readFile(path, "utf8"));
}
