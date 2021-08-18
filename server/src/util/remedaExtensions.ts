import { isDefined, purry } from "remeda";

type ObjectPredicate<K extends string | number | symbol, V> = (entry: [K, V]) => boolean;

function _removeKeys<K extends string | number | symbol, V>(
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

export function removeKeys<K extends string | number | symbol, V, R = Record<K, V>>(
  object: Record<K, V>,
  predicate: ObjectPredicate<K, V>
): R;
export function removeKeys<K extends string | number | symbol, V, R = Record<K, V>>(
  predicate: ObjectPredicate<K, V>
): (object: Record<K, V>) => R;
export function removeKeys() {
  // eslint-disable-next-line prefer-rest-params
  return purry(_removeKeys, arguments);
}

export function removeNotDefined<T extends {}>(
  object: T
): { [P in keyof T]?: Exclude<T[P], null> } {
  return removeKeys(object, ([_, value]) => isDefined(value));
}

/** returns true if only one of the provided elements is defined */
export function xorDefined(...elements: any[]) {
  return elements.reduce((result, element) => (isDefined(element) ? result + 1 : result), 0) === 1;
}
