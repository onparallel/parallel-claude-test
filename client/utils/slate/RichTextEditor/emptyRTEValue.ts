import { RichTextEditorValue } from "./types";

export function emptyRTEValue(): RichTextEditorValue {
  return [{ type: "paragraph", children: [{ text: "" }] }];
}
