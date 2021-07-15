/**
 * Execute the provided async function making sure it takes at least the
 * specified amount of time
 */
export async function stallFor<T>(
  func: () => Promise<T>,
  millis: number
): Promise<T> {
  let error;
  const [result] = await Promise.all([
    func().catch((e) => {
      error = e;
    }),
    new Promise<void>((resolve) => setTimeout(resolve, millis)),
  ]);
  if (error) {
    throw error;
  }
  return result as T;
}
