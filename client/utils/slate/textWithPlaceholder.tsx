import { isNonNullish } from "remeda";
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

export function parseTextWithPlaceholders(
  text: string,
): (
  | { type: "placeholder"; value: string; raw: string }
  | { type: "text"; text: string; raw: string }
)[] {
  const parts = text.split(new RegExp(`(\\{\\{(?:[^{}]+)}})`, "g"));

  return parts.map((part) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const value = part.slice(2, -2).trim();
      return { type: "placeholder" as const, value, raw: part };
    } else {
      return { type: "text" as const, text: part.replaceAll("\\{", "{"), raw: part };
    }
  });
}

export function textWithPlaceholderToSlateNodes(
  value: string,
  placeholders: PlaceholderOption[],
): EditorBlock[] {
  return value.split("\n").map((line) => {
    const parts = parseTextWithPlaceholders(line);
    const children: EditorBlockContent[] = [];
    for (const part of parts) {
      if (part.type === "placeholder") {
        const placeholder = placeholders.find((p) => p.key === part.value);
        if (isNonNullish(placeholder)) {
          children.push({
            type: ELEMENT_PLACEHOLDER,
            placeholder: placeholder.key,
            children: [{ text: "" }],
          });
          continue;
        }
      } else {
        const last = children[children.length - 1];
        const _part = part.text.replaceAll("\\{", "{");
        if (last && "text" in last) {
          last.text += _part;
        } else {
          children.push({ text: _part });
        }
      }
    }
    return { type: "paragraph", children };
  });
}

export function slateNodesToTextWithPlaceholders(
  value: EditorBlock[],
  placeholders: PlaceholderOption[],
) {
  return value
    .map((b) =>
      b.children
        .map((e) =>
          e.type === ELEMENT_PLACEHOLDER && placeholders.some((p) => p.key === e.placeholder)
            ? `{{ ${e.placeholder} }}`
            : "text" in e
              ? (e.text as string).replaceAll("{", "\\{")
              : "",
        )
        .join(""),
    )
    .join("\n");
}
