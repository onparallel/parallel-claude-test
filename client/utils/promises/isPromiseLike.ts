export function isPromiseLike(value: any): value is PromiseLike<any> {
  return Boolean(value && typeof value.then === "function");
}
