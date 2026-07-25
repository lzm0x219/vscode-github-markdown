import { runReleaseGateCommand } from "./gate";

await runReleaseGateCommand(process.argv[2] ?? "");
