import escapeStringRegexp from "escape-string-regexp";
import { Placeholder } from "./PlaceholderPlugin";

export function textWithPlaceholderToSlateNodes(
  value: string,
  placeholders: Placeholder[]
) {
  const parts = value
    .replace(/[\ufeff\n]/g, "")
    .split(
      new RegExp(
        `(#(?:${placeholders
          .map((p) => escapeStringRegexp(p.value))
          .join("|")})#)`,
        "g"
      )
    );
  const result = [];
  for (const part of parts) {
    if (part.startsWith("#") && part.endsWith("#")) {
      const value = part.slice(1, -1);
      if (placeholders.some((p) => p.value === value)) {
        result.push({
          type: "placeholder",
          placeholder: value,
          children: [{ text: "" }],
        });
        continue;
      }
    }
    const last: any = result[result.length - 1];
    if (last && "text" in last) {
      result[result.length - 1] = { text: last.text + part };
    } else {
      result.push({ text: part });
    }
  }
  return result;
}
