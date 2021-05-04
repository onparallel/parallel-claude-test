import { ParagraphElement } from "./types";

export function emptyRTEValue(): ParagraphElement[] {
  return [{ type: "paragraph", children: [{ text: "" }] }];
}
