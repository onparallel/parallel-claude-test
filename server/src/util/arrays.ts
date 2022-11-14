import { identity, reverse, sumBy } from "remeda";
import { MaybeArray } from "./types";

export function unMaybeArray<T>(items: MaybeArray<T>) {
  return Array.isArray(items) ? items : [items];
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

/**
 * @returns last element in array that matches the predicate function
 * @example findLast([1, 2, 3, 4, 5, 6], (e) => e < 5) // 4
 */
export function findLast<T>(array: T[], predicate: (element: T) => boolean): T | undefined {
  return reverse(array).find(predicate);
}

export function average(array: number[]): number {
  return array.length === 0 ? NaN : sumBy(array, identity) / array.length;
}
