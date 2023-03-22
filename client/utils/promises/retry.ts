import { MaybePromise } from "../types";
import { waitFor, WaitForOptions } from "./waitFor";

export interface RetryOptions extends WaitForOptions {
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
  { maxRetries, delay, signal }: RetryOptions
): Promise<TResult> {
  if (maxRetries < 0) {
    throw new Error("maxRetries option must be greater than or equal to 0");
  }
  let iteration = 0;
  do {
    try {
      return await operation(iteration++);
    } catch (error) {
      if (error instanceof StopRetryError) {
        throw error.cause;
      }
      if (maxRetries === 0) {
        throw error;
      } else if (delay) {
        await waitFor(delay, { signal });
      }
    }
  } while (maxRetries-- > 0);
  return null as never;
}

export class StopRetryError extends Error {
  constructor(public override cause: Error) {
    super();
  }
}
