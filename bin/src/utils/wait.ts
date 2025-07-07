export interface WaitForOptions {
  signal?: AbortSignal;
}

export function waitFor(millis: number, options?: WaitForOptions) {
  return new Promise<void>((resolve, reject) => {
    if (options?.signal?.aborted) {
      reject(new Error("The operation was aborted."));
      return;
    }
    const timeout = setTimeout(() => {
      resolve();
    }, millis);
    options?.signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("The operation was aborted."));
    });
  });
}

export interface WaitForResultOptions extends WaitForOptions {
  delay?: number;
  message?: string;
}

export async function waitForResult(
  fn: (iteration: number, { signal }: { signal?: AbortSignal }) => Promise<boolean>,
  { signal, delay, message }: WaitForResultOptions = {},
) {
  let iteration = 0;
  while (!(await fn(iteration, { signal }))) {
    if (message !== undefined) {
      console.log(message);
    }
    await waitFor(delay ?? 0, { signal });
    iteration++;
  }
}
