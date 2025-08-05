import { waitFor, WaitForOptions } from "./waitFor";

export interface WithForcedDelayOptions extends WaitForOptions {
  minDelay: number;
  maxDelay: number;
}

export async function withForcedDelay<T>(
  fn: () => Promise<T>,
  { minDelay, maxDelay, ...options }: WithForcedDelayOptions,
): Promise<T> {
  const [result] = await Promise.all([
    fn(),
    waitFor(Math.random() * (maxDelay - minDelay) + minDelay, options),
  ]);
  return result;
}
