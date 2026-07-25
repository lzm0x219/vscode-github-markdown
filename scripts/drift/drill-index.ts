import { Buffer } from "node:buffer";
import { registerHooks } from "node:module";
import { join } from "node:path";

const vscodeStub = `
export const l10n = {
  t(message, ...args) {
    return message.replace(/\\{(\\d+)\\}/g, (_match, index) => String(args[Number(index)] ?? ""));
  }
};
`;

registerHooks({
  resolve(specifier, _context, nextResolve) {
    if (specifier !== "vscode") return nextResolve(specifier);
    return {
      shortCircuit: true,
      url: `data:text/javascript;base64,${Buffer.from(vscodeStub).toString("base64")}`
    };
  }
});

const outputDirectory = join(process.cwd(), "artifacts", "drift-drill");
const { writeSimulatedDriftDrill } = await import("./drill");
const report = await writeSimulatedDriftDrill(outputDirectory);
console.log(
  `Simulated drift drill: detection ${report.detectionLatencySeconds}s, recovery ${report.recoveryLatencySeconds}s, SLO ${report.withinSlo ? "met" : "missed"}`
);
if (!report.withinSlo || report.recoveryConclusion !== "success") {
  throw new Error(`Simulated drift drill failed. See ${outputDirectory}`);
}
