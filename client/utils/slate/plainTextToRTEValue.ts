import { CustomElement } from "./types";

export function plainTextToRTEValue(value: string): CustomElement[] {
  return value
    .split("\n")
    .map((line) => ({ type: "paragraph", children: [{ text: line }] }));
}
