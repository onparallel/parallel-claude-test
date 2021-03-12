import { RichTextEditorValue } from "@parallel/components/common/RichTextEditor";

export function emptyRTEValue(): RichTextEditorValue {
  return [{ children: [{ text: "" }] }];
}
