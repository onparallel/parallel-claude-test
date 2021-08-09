export function zipX<T1, T2, T3>(array1: T1[], array2: T2[], array3: T3[]): [T1, T2, T3][];
export function zipX<T1, T2, T3, T4>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
  array4: T4[]
): [T1, T2, T3, T4][];
export function zipX<T1, T2, T3, T4, T5>(
  array1: T1[],
  array2: T2[],
  array3: T3[],
  array4: T4[],
  array5: T5[]
): [T1, T2, T3, T4, T5][];
export function zipX(...arrays: any[][]) {
  const length = Math.max(...arrays.map((a) => a.length));
  const result: any[] = [];
  for (let i = 0; i < length; ++i) {
    result.push(arrays.map((a) => a[i]));
  }
  return result;
}
