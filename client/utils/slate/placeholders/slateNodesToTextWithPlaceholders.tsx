import { BaseText } from "slate";
import { CustomElement } from "../types";

export function slateNodesToTextWithPlaceholders(value: CustomElement[]) {
  return value[0].children
    .map((child) => {
      if ("type" in child && child.type === "placeholder") {
        return `#${child.placeholder}#`;
      } else {
        return (child as BaseText).text;
      }
    })
    .join("");
}
