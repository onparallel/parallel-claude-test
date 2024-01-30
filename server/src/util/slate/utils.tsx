import { isDefined } from "remeda";
import { SlateNode } from "./render";

export function paragraphIsEmpty(node: SlateNode) {
  return node?.children?.length === 1 && node.children[0]?.text === "";
}

export function isEmptyRTEValue(value: SlateNode[]) {
  return value.length === 1 && paragraphIsEmpty(value[0]);
}

export function fromPlainText(value: string): SlateNode[] {
  return value.split("\n").map((line) => ({ type: "paragraph", children: [{ text: line }] }));
}

export function emptyRTEValue(): SlateNode[] {
  return [{ type: "paragraph", children: [{ text: "" }] }];
}

export function walkSlateNodes(
  nodes: SlateNode[],
  visit: (input: SlateNode) => SlateNode | void,
): SlateNode[] {
  return nodes.map((node) => {
    const result = visit(node) ?? node;
    if (isDefined(result.children)) {
      return { ...result, children: walkSlateNodes(result.children, visit) };
    }
    return result;
  });
}
