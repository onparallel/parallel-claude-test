import escapeHTML from "escape-html";

type Placeholders = {
  contactName: string;
};

type SlateNode = {
  children?: SlateNode[];
  type?:
    | "paragraph"
    | "bulleted-list"
    | "numbered-list"
    | "list-item"
    | "placeholder";
  placeholder?: keyof Placeholders;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export function toHtml(body: SlateNode[], placeholders?: Placeholders) {
  function serialize(node: SlateNode): string {
    if (Array.isArray(node.children)) {
      const children = node.children.map(serialize).join("");
      switch (node.type) {
        case "paragraph":
        case undefined:
          return `<p>${children}</p>`;
        case "placeholder":
          return `<span>${escapeHTML(
            placeholders?.[node.placeholder!] ?? ""
          )}</span>`;
        case "bulleted-list":
          return `<ul style="padding-left:24px">${children}</ul>`;
        case "numbered-list":
          return `<ol>${children}</ol>`;
        case "list-item":
          return `<li>${children}</li>`;
        default:
          return "";
      }
    } else if (typeof node.text === "string") {
      let style = "";
      if (node.bold) {
        style += "font-weight:bold;";
      }
      if (node.italic) {
        style += "font-style:italic;";
      }
      if (node.underline) {
        style += "text-decoration:underline;";
      }
      return `<span${style !== "" ? ` style="${style}"` : ""}>${escapeHTML(
        node.text
      )}</span>`;
    }
    return "";
  }

  return body.map(serialize).join("");
}

export function toPlainText(body: SlateNode[], placeholders?: Placeholders) {
  function serialize(node: SlateNode): string {
    if (Array.isArray(node.children)) {
      switch (node.type) {
        case "paragraph":
        case undefined:
          return `${node.children.map(serialize).join("")}`;
        case "placeholder":
          return placeholders?.[node.placeholder!] ?? "";
        case "bulleted-list":
        case "numbered-list":
          return node.children
            .map((child) => serialize(child).replace(/^/gm, "  "))
            .join("\n");
        case "list-item":
          return node.children
            .map((child, i: number) => {
              switch (child.type) {
                case "paragraph":
                  return `${i === 0 ? "- " : "  "}${serialize(child)}`;
                default:
                  return serialize(child).replace(/^/gm, "  ");
              }
            })
            .join("\n");
      }
    } else if (typeof node.text === "string") {
      return node.text;
    }
    return "";
  }
  return body.map(serialize).join("\n");
}

export function slateParser(placeholders?: Placeholders) {
  return {
    toHtml: (body: SlateNode[]) => toHtml(body, placeholders),
    toPlainText: (body: SlateNode[]) => toPlainText(body, placeholders),
  };
}
