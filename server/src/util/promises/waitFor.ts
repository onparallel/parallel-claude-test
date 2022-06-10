export function waitFor(millis: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, millis));
}
