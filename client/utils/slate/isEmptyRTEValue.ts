import { CustomElement } from "./types";

export function isEmptyRTEValue(content: CustomElement[]) {
  return content?.every((element) => isEmptyParagraph(element));
}

export function isEmptyParagraph(element: CustomElement) {
  return (
    element.type === "paragraph" &&
    element.children.length === 1 &&
    (element.children[0] as any)?.text === ""
  );
}
