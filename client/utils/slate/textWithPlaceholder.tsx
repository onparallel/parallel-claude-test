import escapeStringRegexp from "escape-string-regexp";
import { isDefined } from "remeda";
import {
  ELEMENT_PLACEHOLDER,
  PlaceholderElement,
  PlaceholderInputElement,
  PlaceholderOption,
} from "./PlaceholderPlugin";

import { SlateElement, SlateText } from "./types";

interface EditorBlock extends SlateElement<"paragraph", EditorBlockContent> {}

interface EditorText extends SlateText {}

type EditorBlockContent = EditorText | PlaceholderElement | PlaceholderInputElement;

export function textWithPlaceholderToSlateNodes(
  value: string,
  placeholders: PlaceholderOption[]
): EditorBlock[] {
  return value.split("\n").map((line) => {
    const parts = line.split(
      new RegExp(
        `(\\{\\{(?:${placeholders.map((p) => escapeStringRegexp(p.value)).join("|")})\\}\\})`,
        "g"
      )
    );
    const children: EditorBlockContent[] = [];
    for (const part of parts) {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        const value = part.slice(2, -2);
        const placeholder = placeholders.find((p) => p.value === value);
        if (isDefined(placeholder)) {
          children.push({
            type: ELEMENT_PLACEHOLDER,
            placeholder: value,
            children: [{ text: placeholder.label }],
          });
          continue;
        }
      }
      const last: any = children[children.length - 1];
      const _part = part.replaceAll("\\{", "{");
      if (last && "text" in last) {
        children[children.length - 1] = { text: last.text + _part };
      } else {
        children.push({ text: _part });
      }
    }
    return { type: "paragraph", children };
  });
}

export function slateNodesToTextWithPlaceholders(
  value: EditorBlock[],
  placeholders: PlaceholderOption[]
) {
  return value
    .map((b) =>
      b.children
        .map((e) =>
          e.type === ELEMENT_PLACEHOLDER && placeholders.some((p) => p.value === e.placeholder)
            ? `{{${e.placeholder}}}`
            : "text" in e
            ? (e.text as string).replaceAll("{", "\\{")
            : ""
        )
        .join("")
    )
    .join("\n");
}
