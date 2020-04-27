export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(
  fn: () => Promise<boolean>,
  message: string,
  ms: number
) {
  while (!(await fn())) {
    console.log(message);
    await wait(ms);
  }
}
