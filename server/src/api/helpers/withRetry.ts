import { UnwrapPromise } from "../../util/types";

export function withRetry<Fn extends (...args: any) => any>(
  fn: Fn,
  config: { maxRetries: number; retryIntervalMs: number } = {
    maxRetries: 1,
    retryIntervalMs: 0,
  }
) {
  return async (...args: Parameters<Fn>) => {
    async function execWithRetry(
      maxRetries: number,
      retryIntervalMs: number
    ): Promise<UnwrapPromise<ReturnType<Fn>>> {
      try {
        return await fn(...(args as any));
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
