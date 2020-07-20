import { purry } from "remeda";

type ObjectPredicate<K extends string | number | symbol, V> = (
  entry: [K, V]
) => boolean;

type ArrayPredicate<T> = (entry: T) => boolean;

function _removeKeys<K extends string | number | symbol, V, R = Record<K, V>>(
  object: Record<K, V>,
  predicate: ObjectPredicate<K, V>
) {
  const result: any = {};
  for (const [key, value] of Object.entries(object)) {
    if (predicate([key as K, value as V])) {
      result[key] = value;
    }
  }
  return result;
}

export function removeKeys<
  K extends string | number | symbol,
  V,
  R = Record<K, V>
>(object: Record<K, V>, predicate: ObjectPredicate<K, V>): Record<K, V>;
export function removeKeys<
  K extends string | number | symbol,
  V,
  R = Record<K, V>
>(predicate: ObjectPredicate<K, V>): (object: Record<K, V>) => Record<K, V>;
export function removeKeys() {
  // eslint-disable-next-line prefer-rest-params
  return purry(_removeKeys, arguments);
}

export function isDefined(value: any) {
  return value !== undefined && value !== undefined;
}

export function filterDefined<T>(values: T[]): Exclude<T, undefined | null>[] {
  return values.filter(isDefined) as Exclude<T, undefined | null>[];
}

export function removeNotDefined<T extends {}>(
  object: T
): { [P in keyof T]?: Exclude<T[P], null> } {
  return removeKeys(object, ([_, value]) => !isDefined(value));
}

function _count<T>(array: T[], predicate: ArrayPredicate<T>) {
  let count = 0;
  for (const item of array) {
    if (predicate(item)) {
      count += 1;
    }
  }
  return count;
}

export function count<T>(array: T[], predicate: ArrayPredicate<T>): number;
export function count<T>(predicate: ArrayPredicate<T>): (array: T[]) => number;
export function count() {
  // eslint-disable-next-line prefer-rest-params
  return purry(_count, arguments);
}

export function zip<T1, T2>(array1: T1[], array2: T2[]): [T1, T2][];
export function zip<T1, T2, T3>(
  array1: T1[],
  array2: T2[],
  array3: T3[]
): [T1, T2, T3][];
export function zip<T1, T2, T3, T4>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
  array4: T4[]
): [T1, T2, T3, T4][];
export function zip<T extends Array<any>>(...arrays: T[]) {
  const result = [];
  const maxLength = Math.max(...arrays.map((a) => a.length));
  for (let i = 0; i < maxLength; i++) {
    result.push(arrays.map((a) => a[i]));
  }
  return result;
}
