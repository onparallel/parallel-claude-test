export function withRetry<Fn extends (...args: any) => any>(
  fn: Fn,
  config: { maxRetries: number; retryIntervalMs: number; thisArg: any } = {
    maxRetries: 1,
    retryIntervalMs: 0,
    thisArg: {},
  }
) {
  return async (...args: Parameters<Fn>) => {
    async function execWithRetry(
      maxRetries: number,
      retryIntervalMs: number
    ): Promise<ReturnType<Fn>> {
      try {
        return await fn.apply(config.thisArg, args);
      } catch (e) {
        if (maxRetries > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
          return await execWithRetry(maxRetries - 1, retryIntervalMs);
        } else {
          throw e;
        }
      }
    }

    return await execWithRetry(config.maxRetries, config.retryIntervalMs);
  };
}
