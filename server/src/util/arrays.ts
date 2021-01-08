import { MaybeArray } from "./types";

export function unMaybeArray<T>(items: MaybeArray<T>) {
  return Array.isArray(items) ? items : [items];
}

export function partition<T, S extends T>(
  array: T[],
  predicate: (value: T) => value is S
): [S[], Exclude<T, S>[]];
export function partition<T>(
  array: T[],
  predicate: (value: T) => unknown
): [T[], T[]];
export function partition<T>(array: T[], predicate: (value: T) => unknown) {
  const match = [];
  const noMatch = [];
  for (const item of array) {
    if (predicate(item)) {
      match.push(item);
    } else {
      noMatch.push(item);
    }
  }
  return [match, noMatch];
}
