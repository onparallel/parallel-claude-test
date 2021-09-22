import { Maybe } from "@parallel/utils/types";
import { isDefined } from "remeda";
import { SlateElement } from "../types";
import { RichTextEditorValue } from "./types";

export function isEmptyRTEValue(content: Maybe<RichTextEditorValue>) {
  return !isDefined(content) || content.every((element) => isEmptyParagraph(element));
}

export function isEmptyParagraph(element: SlateElement<any, any>) {
  return (
    element.type === "paragraph" &&
    element.children.length === 1 &&
    (element.children[0] as any)?.text === ""
  );
}
