const temporalGlobal = globalThis as typeof globalThis & { Temporal?: object };

const originalTemporal = temporalGlobal.Temporal;

// vitest 5.0.0 crashes inside its fake-timers install when `Temporal` is a
// global with a non-configurable `Temporal.Now` (native Node.js >= 26, or the
// Temporal polyfill injected by nub's runtime on older Node). Tests here never
// touch Temporal, so hide the global before vitest snapshots it on first fake
// timer use and restore it when the worker exits.
delete temporalGlobal.Temporal;

if (typeof originalTemporal === "object") {
  process.on("exit", () => {
    temporalGlobal.Temporal = originalTemporal;
  });
}

export {};
