import { RichTextEditorValue } from "@parallel/components/common/RichTextEditor";
import { Element, Text } from "slate";

export function isEmptyRTEValue(content: RichTextEditorValue) {
  return content?.every(
    (block) =>
      (block.children as Element) &&
      (block.children as Element).length === 1 &&
      ((block.children as Element)[0] as Text)?.text === ""
  );
}
