export function ellipsis(
  text: string,
  maxLength: number,
  prefix = "..."
): string {
  return text.length > maxLength
    ? text.slice(0, maxLength - prefix.length).concat(prefix)
    : text;
}
