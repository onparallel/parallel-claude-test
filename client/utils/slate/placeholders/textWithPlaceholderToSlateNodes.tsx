import escapeStringRegexp from "escape-string-regexp";
import { Placeholder } from "./PlaceholderPlugin";

export function textWithPlaceholderToSlateNodes(
  value: string,
  placeholders: Placeholder[]
) {
  const paragraphs = value
    .split("\n")
    .map((line) =>
      line.split(
        new RegExp(
          `(#(?:${placeholders
            .map((p) => escapeStringRegexp(p.value))
            .join("|")})#)`,
          "g"
        )
      )
    );
  const result = [];

  for (const paragraph of paragraphs) {
    const children = [];
    for (const part of paragraph) {
      if (part.startsWith("#") && part.endsWith("#")) {
        const value = part.slice(1, -1);
        if (placeholders.some((p) => p.value === value)) {
          children.push({
            type: "placeholder",
            placeholder: value,
            children: [{ text: "" }],
          });
          continue;
        }
      }
      const last: any = children[children.length - 1];
      if (last && "text" in last) {
        children[children.length - 1] = { text: last.text + part };
      } else {
        children.push({ text: part });
      }
    }
    result.push({ type: "paragraph", children });
  }

  return result;
}
