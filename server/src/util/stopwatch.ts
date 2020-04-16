export async function stopwatch(fn: () => void | Promise<void>) {
  const time = process.hrtime();
  await fn();
  return stopwatchEnd(time);
}

export function stopwatchEnd(init: ReturnType<typeof process.hrtime>) {
  const [seconds, nanoseconds] = process.hrtime(init);
  return seconds * 1000 + Math.round(nanoseconds / 1e6);
}
