import { Element, Text } from "slate";
import { RichTextEditorContent } from "../../components/common/RichTextEditor";

export function isEmptyContent(content: RichTextEditorContent) {
  return (
    content?.length === 1 &&
    content[0].children &&
    (content[0].children as Element).length === 1 &&
    ((content[0].children as Element)[0] as Text)?.text === ""
  );
}
