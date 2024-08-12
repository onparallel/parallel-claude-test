export function never(message?: string): never {
  throw new Error(message ?? "Should not happen");
}
