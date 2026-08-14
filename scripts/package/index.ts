import { spawn } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = process.cwd();
const sourcePath = join(projectRoot, "README.md");
const marketplacePath = join(projectRoot, "README.marketplace.md");
const picturePattern = /^  <picture>\n(?:    <source[^\n]*>\n)+    (<img[^\n]*>)\n  <\/picture>$/gm;

const source = await readFile(sourcePath, "utf8");
const pictures = [...source.matchAll(picturePattern)];
if (pictures.length !== 1) {
  throw new Error(`Expected exactly one theme-aware README picture, found ${pictures.length}`);
}

const marketplaceReadme = source.replace(picturePattern, (_, image: string) => `  ${image}`);
await writeFile(marketplacePath, marketplaceReadme);

try {
  await run("nubx", [
    "vsce",
    "package",
    "--no-dependencies",
    "--readme-path",
    "README.marketplace.md",
    ...process.argv.slice(2)
  ]);
} finally {
  await rm(marketplacePath, { force: true });
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}
