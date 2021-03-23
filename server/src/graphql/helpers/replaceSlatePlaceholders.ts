type Placeholder = {
  contactName: string;
};

type SlateNode = {
  children?: SlateNode[];
  type?: "paragraph" | "bulleted-list" | "numbered-list" | "placeholder";
  placeholder?: keyof Placeholder;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};
export function replaceSlatePlaceholders(
  body: SlateNode[],
  placeholders: Placeholder
) {
  function deepSearchPlaceholders(node: SlateNode): SlateNode {
    if (node.type === "placeholder") {
      return { text: placeholders[node.placeholder!] };
    } else if (Array.isArray(node.children)) {
      return { ...node, children: node.children.map(deepSearchPlaceholders) };
    } else {
      return node;
    }
  }
  return body.map(deepSearchPlaceholders);
}
