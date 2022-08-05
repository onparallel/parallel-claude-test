export function unCamelCase(value: string) {
  return value[0].toUpperCase() + value.slice(1).replace(/([A-Z]+)/g, " $1");
}

export function isNotEmptyText(value: string) {
  return value.trim().length > 0;
}
