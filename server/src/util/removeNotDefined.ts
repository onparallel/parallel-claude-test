export function removeNotDefined<T extends {}>(
  object: T
): { [P in keyof T]?: Exclude<T[P], null> } {
  const result: any = {};
  for (const [key, value] of Object.entries(object)) {
    if (value === null || value === undefined) {
      continue;
    }
    result[key] = value;
  }
  return result;
}
