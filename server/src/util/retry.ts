import { waitFor } from "./promises/waitFor";
import { MaybePromise } from "./types";

interface RetryOptions {
  maxRetries: number;
  delay?: number;
}

/**
 * Retries the given async operation as many times as specified
 * @param operation An async operation, returns true if the operation was successful
 * @param options.maxRetries Maximum number of times to try the operation
 * @param options.delay How long to wait before retrying again
 */
export async function retry<TResult>(
  operation: (iteration: number) => MaybePromise<TResult>,
  { maxRetries, delay }: RetryOptions
): Promise<TResult> {
  if (maxRetries < 1) {
    throw new Error("maxRetries option must be greater than or equal to 1");
  }
  let iteration = 0;
  while (maxRetries-- > 0) {
    try {
      return await operation(iteration++);
    } catch (error) {
      if (maxRetries === 1) {
        throw error;
      } else if (delay) {
        await waitFor(delay);
      }
    }
  }
  return null as never;
}
