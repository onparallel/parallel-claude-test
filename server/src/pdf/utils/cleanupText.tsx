export function cleanupText(text: string) {
  return text.replace(/\t/g, " ".repeat(4));
}
