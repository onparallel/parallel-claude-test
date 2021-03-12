import { RichTextEditorValue } from "@parallel/components/common/RichTextEditor";
import { Element, Text } from "slate";

export function isEmptyRTEValue(content: RichTextEditorValue) {
  return (
    content?.length === 1 &&
    (content[0].children as Element) &&
    (content[0].children as Element).length === 1 &&
    ((content[0].children as Element)[0] as Text)?.text === ""
  );
}
