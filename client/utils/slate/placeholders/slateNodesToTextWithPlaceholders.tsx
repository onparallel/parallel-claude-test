import { Node, Element } from "slate";

export function slateNodesToTextWithPlaceholders(value: Node[]) {
  return (value[0] as Element).children
    .map((child: any) => {
      if (child.type === "placeholder") {
        return `#${child.placeholder}#`;
      } else {
        return child.text;
      }
    })
    .join("");
}
