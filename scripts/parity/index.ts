import { registerHooks } from "node:module";

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

const { runParityCommand } = await import("./cli");
await runParityCommand();
