import escapeHTML from "escape-html";
import { Contact, Petition, User } from "../db/__types";
import { fullName } from "./fullName";

interface SlateContext {
  petition?: Partial<Petition> | null;
  user?: Partial<User> | null;
  contact?: Partial<Contact> | null;
}

type SlateNode = {
  children?: SlateNode[];
  type?:
    | "paragraph"
    | "bulleted-list"
    | "numbered-list"
    | "list-item"
    | "placeholder";
  placeholder?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

function getPlaceholder(key?: string, ctx?: SlateContext) {
  if (!ctx || !key) return "";
  switch (key) {
    case "contact-first-name":
      return ctx.contact?.first_name ?? "";
    case "contact-last-name":
      return ctx.contact?.last_name ?? "";
    case "contact-full-name":
      return fullName(
        ctx.contact?.first_name ?? "",
        ctx.contact?.last_name ?? ""
      )!;
    case "contact-email":
      return ctx.contact?.email ?? "";
    case "user-first-name":
      return ctx.user?.first_name ?? "";
    case "user-last-name":
      return ctx.user?.last_name ?? "";
    case "user-full-name":
      return fullName(ctx.user?.first_name ?? "", ctx.user?.last_name ?? "")!;
    case "petition-title":
      return ctx.petition?.name ?? "";
    default:
      return "";
  }
}

export function toHtml(body: SlateNode[], ctx?: SlateContext) {
  function serialize(node: SlateNode): string {
    if (Array.isArray(node.children)) {
      const children = node.children.map(serialize).join("");
      switch (node.type) {
        case "paragraph":
        case undefined:
          return `<p>${children}</p>`;
        case "placeholder":
          return `<span>${escapeHTML(
            getPlaceholder(node.placeholder, ctx)
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

export function toPlainText(body: SlateNode[], ctx?: SlateContext) {
  function serialize(node: SlateNode): string {
    if (Array.isArray(node.children)) {
      switch (node.type) {
        case "paragraph":
        case undefined:
          return `${node.children.map(serialize).join("")}`;
        case "placeholder":
          return getPlaceholder(node.placeholder, ctx);
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

export function slateParser(ctx?: SlateContext) {
  return {
    toHtml: (body: SlateNode[]) => toHtml(body, ctx),
    toPlainText: (body: SlateNode[]) => toPlainText(body, ctx),
  };
}
