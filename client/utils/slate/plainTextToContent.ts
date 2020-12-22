import { RichTextEditorContent } from "@parallel/components/common/RichTextEditor";

export function plainTextToContent(value: string): RichTextEditorContent {
  return value.split("\n").map((line) => ({ children: [{ text: line }] }));
}
