export function structuredClone(value: any) {
  return "structuredClone" in global
    ? global.structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}
