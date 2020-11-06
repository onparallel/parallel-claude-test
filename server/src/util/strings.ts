/**
 * converts @param text to capitalized words
 * ex: titleize("HELLO_WORLD") === "Hello World"
 */
export function titleize(text: string) {
  return text
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase().concat(text.slice(1).toLowerCase());
}
