import { identity, sumBy } from "remeda";

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

export function zipX<T1, T2, T3>(array1: T1[], array2: T2[], array3: T3[]): [T1, T2, T3][];
export function zipX<T1, T2, T3, T4>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
  array4: T4[],
): [T1, T2, T3, T4][];
export function zipX<T1, T2, T3, T4, T5>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
  array4: T4[],
  array5: T5[],
): [T1, T2, T3, T4, T5][];
export function zipX(...arrays: any[][]) {
  const length = Math.max(...arrays.map((a) => a.length));
  const result: any[] = [];
  for (let i = 0; i < length; ++i) {
    result.push(arrays.map((a) => a[i]));
  }
  return result;
}

export function average(array: number[]): number {
  return array.length === 0 ? NaN : sumBy(array, identity) / array.length;
}

export function median(arr: number[]) {
  if (arr.length === 0) return NaN;

  arr.sort((a, b) => a - b);
  const len = arr.length;
  const mid = Math.floor(len / 2);

  if (len % 2 === 0) {
    return (arr[mid - 1] + arr[mid]) / 2;
  } else {
    return arr[mid];
  }
}

export function quartiles(arr: number[]): [number, number] {
  if (arr.length === 0) return [NaN, NaN];
  if (arr.length === 1) return [arr[0], arr[0]];

  arr.sort((a, b) => a - b);
  const len = arr.length;
  const mid = Math.floor(len / 2);
  const lowerQIndex = Math.floor(mid / 2);
  const upperQIndex = Math.floor((len + mid) / 2);
  const lowerQ = median(arr.slice(0, mid).slice(0, lowerQIndex + 1));
  const upperQ = median(arr.slice(mid, len).slice(0, upperQIndex - mid + 1));

  return [lowerQ, upperQ];
}
