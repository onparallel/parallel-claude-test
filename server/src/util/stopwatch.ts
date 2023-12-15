import { MaybePromise } from "./types";

export async function stopwatch(fn: () => MaybePromise<void>) {
  const time = process.hrtime();
  await fn();
  return stopwatchEnd(time);
}

export async function withStopwatch<T>(
  fn: () => MaybePromise<T>,
): Promise<{ time: number; result: T }> {
  let result;
  const time = await stopwatch(async () => {
    result = await fn();
  });
  return { time, result: result! };
}

export function stopwatchEnd(init: ReturnType<typeof process.hrtime>) {
  const [seconds, nanoseconds] = process.hrtime(init);
  return seconds * 1000 + Math.round(nanoseconds / 1e6);
}
