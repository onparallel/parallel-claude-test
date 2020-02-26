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
  return purry(_removeKeys, arguments);
}

export function removeNotDefined<T extends {}>(
  object: T
): { [P in keyof T]?: Exclude<T[P], null> } {
  return removeKeys(
    object,
    ([_, value]) => value !== null && value !== undefined
  );
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
  return purry(_count, arguments);
}
