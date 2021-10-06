import { PredIndexed } from "remeda/dist/commonjs/_types";
import { MaybeArray } from "./types";

export function unMaybeArray<T>(items: MaybeArray<T>) {
  return Array.isArray(items) ? items : [items];
}

export function partition<T, S extends T>(
  array: T[],
  predicate: (value: T) => value is S
): [S[], Exclude<T, S>[]];
export function partition<T>(array: T[], predicate: (value: T) => unknown): [T[], T[]];
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

/**
 * Chunk the input array and keep adding elements to the current chunk as long as `predicate` returns true.
 */
export function chunkWhile<T>(array: T[], predicate: (current: T[], value: T) => boolean) {
  let current: T[] = [];
  const chunks = [current];
  for (const element of array) {
    if (predicate(current, element)) {
      current.push(element);
    } else {
      current = [element];
      chunks.push(current);
    }
  }
  return chunks;
}

export function sumBy<T>(array: T[], fn: PredIndexed<T, number>) {
  return array.reduce((acc, curr, index) => acc + fn(curr, index, array), 0);
}
