export function unCamelCase(value: string) {
  return (
    value[0].toUpperCase() +
    value.slice(1).replace(/(?<=[a-z\b])([A-Z])/g, " $1")
  );
}
