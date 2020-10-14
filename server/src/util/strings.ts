/**
 * converts snake_case @param text to capitalized words
 * ex: snakeCaseToCapitalizedText("HELLO_WORLD") === "Hello World"
 */
export function snakeCaseToCapitalizedText(text: string): string {
  return text
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase().concat(text.slice(1).toLowerCase());
}
