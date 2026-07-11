export type CssBuildRunner<Result> = {
  buildAll(): Promise<Result>;
  rebuild(): Promise<Result>;
};

export function createCssBuildRunner<Result>(operations: {
  buildAll(): Promise<Result>;
  buildPreview(): Promise<Result>;
}): CssBuildRunner<Result> {
  let hasCompleteBuild = false;

  async function buildAll(): Promise<Result> {
    const result = await operations.buildAll();
    hasCompleteBuild = true;
    return result;
  }

  return {
    buildAll,
    rebuild() {
      return hasCompleteBuild ? operations.buildPreview() : buildAll();
    }
  };
}
