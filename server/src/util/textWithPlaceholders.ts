export function parseTextWithPlaceholders(text: string) {
  const parts = text.split(new RegExp(`(\\{\\{(?:[^{}]+)}})`, "g"));

  return parts.map((part) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const value = part.slice(2, -2).trim();
      return { type: "placeholder" as const, value };
    }
    return { type: "text" as const, text: part.replaceAll("\\{", "{") };
  });
}
