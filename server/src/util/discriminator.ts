import { unMaybeArray } from "./arrays";
import { MaybeArray, Prettify } from "./types";

export function discriminator<T, K extends string & keyof T, V extends T[K]>(
  prop: K,
  value: MaybeArray<V>,
): (item: T) => item is Prettify<T & { [key in K]: V }> {
  return ((item: T) => unMaybeArray(value).some((v) => v === item[prop])) as (
    item: T,
  ) => item is T & Record<K, V>;
}
