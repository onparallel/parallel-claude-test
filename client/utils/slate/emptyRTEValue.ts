import { CustomElement } from "./types";

export function emptyRTEValue(): CustomElement[] {
  return [{ type: "paragraph", children: [{ text: "" }] }];
}
