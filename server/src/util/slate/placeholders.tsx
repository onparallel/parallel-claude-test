import { isNonNullish } from "remeda";
import { SlateNode, renderSlateToHtml, renderSlateToText, renderWhiteSpace } from "./render";
import { walkSlateNodes } from "./utils";

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
      return { type: "placeholder", value, raw: part };
    } else {
      return { type: "text", text: part.replaceAll("\\{", "{"), raw: part };
    }
  });
}

export function replacePlaceholdersInText(
  text: string,
  replacer: (value: string) => string,
): string {
  return parseTextWithPlaceholders(text)
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      } else {
        return `{{ ${replacer(part.value)} }}`;
      }
    })
    .join("");
}

export function replacePlaceholdersInSlate(
  nodes: SlateNode[],
  replacer: (value: string) => string,
): SlateNode[] {
  return walkSlateNodes(nodes, (node) => {
    if (node.type === "placeholder" && isNonNullish(node.placeholder)) {
      return {
        ...node,
        placeholder: replacer(node.placeholder),
      };
    }
  });
}

export function renderSlateWithPlaceholdersToText(
  nodes: SlateNode[],
  getPlaceholder?: (value: string) => string,
) {
  return renderSlateToText(nodes, {
    override: {
      placeholder: (node) => getPlaceholder?.(node.placeholder!) ?? "",
    },
  });
}

export function renderTextWithPlaceholders(
  text: string,
  getPlaceholder: (value: string) => string,
) {
  return parseTextWithPlaceholders(text)
    .map((p) => (p.type === "text" ? p.text : getPlaceholder(p.value)))
    .join("");
}

export function renderSlateWithPlaceholdersToHtml(
  nodes: SlateNode[],
  getPlaceholder?: (value: string) => string,
) {
  return renderSlateToHtml(nodes, {
    override: {
      placeholder: (node) => (
        <span>{renderWhiteSpace(getPlaceholder?.(node.placeholder!) ?? "")}</span>
      ),
    },
  });
}

export function interpolatePlaceholdersInSlate(
  nodes: SlateNode[],
  getPlaceholder?: (value: string) => string,
) {
  return walkSlateNodes(nodes, (node) => {
    if (node.type === "placeholder") {
      return { text: getPlaceholder?.(node.placeholder!) ?? "" };
    }
  });
}
