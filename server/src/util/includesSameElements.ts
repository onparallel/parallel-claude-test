/**
 * Checks if two arrays contain the same elements, regardless of their order.
 * The comparison is done using a custom comparison function.
 *
 * @template T - The type of elements in the arrays
 * @param {T[] | undefined} a - The first array to compare
 * @param {T[] | undefined} b - The second array to compare
 * @param {(a: T, b: T) => boolean} compareFn - A function that determines if two elements are equal
 * @returns {boolean} - Returns true if both arrays contain the same elements (in any order), false otherwise
 *
 * @example
 * // Compare arrays of numbers
 * const arr1 = [1, 2, 3];
 * const arr2 = [3, 1, 2];
 * includesSameElements(arr1, arr2, (a, b) => a === b); // returns true
 *
 * @example
 * // Compare arrays of objects
 * const arr1 = [{ id: 1 }, { id: 2 }];
 * const arr2 = [{ id: 2 }, { id: 1 }];
 * includesSameElements(arr1, arr2, (a, b) => a.id === b.id); // returns true
 */
export function includesSameElements<T>(
  a: T[] | undefined,
  b: T[] | undefined,
  compareFn: (a: T, b: T) => boolean,
) {
  return !!a && !!b && a.length === b.length && a.every((v) => b.some((w) => compareFn(v, w)));
}
