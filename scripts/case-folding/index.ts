import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateCaseFoldingSource } from "./generate";

const generated = generateCaseFoldingSource();
await writeFile(join(process.cwd(), "src/generated/unicode-case-folding.ts"), generated.source);
console.log(
  `Generated ${generated.entries} Unicode case-folding mappings in ${generated.byteLength} bytes.`
);
