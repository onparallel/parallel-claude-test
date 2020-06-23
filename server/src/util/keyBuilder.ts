export function keyBuilder<T, K extends keyof T | ((item: T) => string)>(
  properties: K[]
) {
  return (item: T) =>
    properties
      .map((prop: any) => {
        if (typeof prop === "function") {
          return prop(item);
        } else {
          return (item as any)[prop];
        }
      })
      .join(",");
}
