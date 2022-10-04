export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(
  fn: (iteration: number) => Promise<boolean>,
  ms: number
): Promise<void>;
export async function waitFor(
  fn: (iteration: number) => Promise<boolean>,
  message: string,
  ms: number
): Promise<void>;
export async function waitFor(
  fn: (iteration: number) => Promise<boolean>,
  message: string | number,
  ms?: number
) {
  const _ms = typeof message === "number" ? message : ms!;
  const _message = typeof message === "number" ? undefined : message;
  let iteration = 0;
  while (!(await fn(iteration))) {
    if (_message !== undefined) {
      console.log(_message);
    }
    await wait(_ms);
    iteration++;
  }
}
