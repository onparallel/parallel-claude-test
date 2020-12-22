import { RichTextEditorContent } from "@parallel/components/common/RichTextEditor";

export function emptyContent(): RichTextEditorContent {
  return [{ children: [{ text: "" }] }];
}
