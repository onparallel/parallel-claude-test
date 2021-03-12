import { RichTextEditorValue } from "@parallel/components/common/RichTextEditor";

export function plainTextToRTEValue(value: string): RichTextEditorValue {
  return value.split("\n").map((line) => ({ children: [{ text: line }] }));
}
