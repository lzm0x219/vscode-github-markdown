export type RebuildQueue = {
  request(): void;
  idle(): Promise<void>;
};

export function createRebuildQueue(
  build: () => Promise<void>,
  onError: (error: unknown) => void = console.error
): RebuildQueue {
  let isRunning = false;
  let isPending = false;
  let current = Promise.resolve();

  async function drain(): Promise<void> {
    isRunning = true;
    try {
      while (isPending) {
        isPending = false;
        try {
          await build();
        } catch (error) {
          onError(error);
        }
      }
    } finally {
      isRunning = false;
    }
  }

  return {
    request() {
      isPending = true;
      if (!isRunning) current = drain();
    },
    idle() {
      return current;
    }
  };
}
