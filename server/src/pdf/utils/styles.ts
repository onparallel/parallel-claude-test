import { Style } from "@react-pdf/types";
import { isDefined } from "remeda";

export function mergeStyles(...styles: (Style | Style[] | undefined)[]) {
  const merged = [];
  for (const style of styles) {
    if (isDefined(style)) {
      if (Array.isArray(style)) {
        merged.push(...style);
      } else {
        merged.push(style);
      }
    }
  }
  return merged;
}
