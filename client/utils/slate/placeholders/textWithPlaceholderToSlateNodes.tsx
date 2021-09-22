import escapeStringRegexp from "escape-string-regexp";
import { PlaceholderOption } from "./PlaceholderPlugin";

import { SlateElement, SlateText } from "../types";

interface EditorBlock extends SlateElement<"paragraph", EditorBlockContent> {}

interface EditorPlaceholder extends SlateElement<"placeholder", EditorText> {
  placeholder: string;
}

interface EditorText extends SlateText {}

type EditorBlockContent = EditorText | EditorPlaceholder;

export function textWithPlaceholderToSlateNodes(
  value: string,
  placeholders: PlaceholderOption[]
): EditorBlock[] {
  return value.split("\n").map((line) => {
    const parts = line.split(
      new RegExp(`(#(?:${placeholders.map((p) => escapeStringRegexp(p.value)).join("|")})#)`, "g")
    );
    const children: EditorBlockContent[] = [];
    for (const part of parts) {
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
    return { type: "paragraph", children };
  });
}
