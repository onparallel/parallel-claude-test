import { waitFor, WaitForOptions } from "./promises/waitFor";
import { MaybePromise } from "./types";

export interface RetryOptions extends WaitForOptions {
  maxRetries: number;
  delay?: number | ((error: unknown, iteration: number) => number | undefined);
}

/**
 * Retries the given async operation as many times as specified
 * @param operation An async operation, returns true if the operation was successful
 * @param options.maxRetries Maximum number of times to try the operation
 * @param options.delay How long to wait before retrying again, or a function that returns the delay based on the error and iteration
 */
export async function retry<TResult>(
  operation: (iteration: number) => MaybePromise<TResult>,
  { maxRetries, delay, signal }: RetryOptions,
): Promise<TResult> {
  if (maxRetries < 0) {
    throw new Error("maxRetries option must be greater than or equal to 0");
  }
  let iteration = 0;
  do {
    try {
      signal?.throwIfAborted();
      return await operation(iteration++);
    } catch (error) {
      if (signal?.aborted) {
        throw new Error("The operation was aborted.");
      }
      if (error instanceof StopRetryError) {
        throw error.cause;
      }
      if (maxRetries === 0) {
        throw error;
      } else if (delay) {
        const currentDelay = typeof delay === "function" ? delay(error, iteration) : delay;
        if (currentDelay && currentDelay > 0) {
          await waitFor(currentDelay, { signal });
        }
      }
    }
  } while (maxRetries-- > 0);
  return null as never;
}

export class StopRetryError extends Error {
  constructor(public override cause: unknown) {
    super();
  }
}
