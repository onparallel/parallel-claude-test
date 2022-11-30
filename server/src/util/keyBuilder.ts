export function keyBuilder<
  T,
  K extends keyof T | ((item: T) => string | number | null | undefined)
>(properties: K[]) {
  return (item: T) =>
    properties
      .map((prop: any) => {
        return JSON.stringify(typeof prop === "function" ? prop(item) : (item as any)[prop]);
      })
      .join(",");
}
