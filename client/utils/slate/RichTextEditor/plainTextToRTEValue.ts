import { RichTextEditorValue } from "./types";

export function plainTextToRTEValue(value: string): RichTextEditorValue {
  return value.split("\n").map((line) => ({ type: "paragraph", children: [{ text: line }] }));
}
