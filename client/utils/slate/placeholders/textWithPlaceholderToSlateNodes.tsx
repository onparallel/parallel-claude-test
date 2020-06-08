import { Placeholder } from "./PlaceholderPlugin";
export function textWithPlaceholderToSlateNodes(
  value: string,
  placeholders: Placeholder[]
) {
  const parts = value.replace(/[\ufeff\n]/g, "").split(/(#[a-z-]+#)/g);
  return parts.map((part) => {
    if (part.startsWith("#") && part.endsWith("#")) {
      const value = part.slice(1, -1);
      const placeholder = placeholders.find((p) => p.value === value);
      if (placeholder) {
        return {
          type: "placeholder",
          placeholder: value,
          children: [{ text: "" }],
        };
      }
    }
    return { text: part };
  });
}
