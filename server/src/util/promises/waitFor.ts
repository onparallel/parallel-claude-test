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
