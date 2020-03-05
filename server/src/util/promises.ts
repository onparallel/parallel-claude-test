export async function props<T extends {}>(
  promises: { [K in keyof T]: PromiseLike<T[K]> }
): Promise<T> {
  const keys = Object.keys(promises) as (keyof T)[];
  const results = await Promise.all(keys.map(k => promises[k]));
  return Object.fromEntries(keys.map((k, i) => [k, results[i]])) as any;
}
