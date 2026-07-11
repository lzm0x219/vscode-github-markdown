export function shouldOpenVisualizer(args: readonly string[]): boolean {
  return args.includes("--open-visualizer");
}
