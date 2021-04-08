export function toSelectOption(value: string | null) {
  return value === null ? null : { value, label: value };
}
