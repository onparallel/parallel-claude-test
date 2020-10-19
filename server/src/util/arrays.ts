import { MaybeArray } from "./types";

export function unMaybeArray<T>(items: MaybeArray<T>) {
  return Array.isArray(items) ? items : [items];
}

type Sortable = number | Date;
/** returns max element of type T sorted by prop function. */
export function findMax<T>(items: T[], prop: (value: T) => Sortable): T {
  return items.sort((a, b) => (prop(a) >= prop(b) ? -1 : 1))[0];
}
