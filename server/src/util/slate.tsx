import { Contact, Petition, User } from "../db/__types";
import { fullName } from "./fullName";
import { CSSProperties, Fragment } from "react";
import { renderToString } from "react-dom/server";

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

function renderDOMNode(node: SlateNode, ctx?: SlateContext, index?: number) {
  if (Array.isArray(node.children)) {
    switch (node.type) {
      case "paragraph":
      case undefined:
        return (
          <p style={{ margin: 0 }} key={index}>
            {paragraphIsEmpty(node) ? (
              <br />
            ) : (
              node.children.map((child: any, index: number) => (
                <Fragment key={index}>{renderDOMNode(child, ctx)}</Fragment>
              ))
            )}
          </p>
        );
      case "placeholder":
        return <span>{getPlaceholder(node.placeholder, ctx)}</span>;
      case "bulleted-list":
        return (
          <ul
            style={{ margin: 0, marginLeft: "24px", paddingLeft: 0 }}
            key={index}
          >
            {node.children.map((child: any, index: number) =>
              renderDOMNode(child, ctx, index)
            )}
          </ul>
        );
      case "list-item": {
        return (
          <li key={index} style={{ marginLeft: 0 }}>
            {node.children.map((child: any, index: number) =>
              renderDOMNode(child, ctx, index)
            )}
          </li>
        );
      }
    }
  } else if (typeof node.text === "string") {
    const style: CSSProperties = {};
    if (node.bold) {
      style.fontWeight = "bold";
    }
    if (node.italic) {
      style.fontStyle = "italic";
    }
    if (node.underline) {
      style.textDecoration = "underline";
    }
    return (
      <span style={style} key={index}>
        {node.text}
      </span>
    );
  }
  return null;
}

function paragraphIsEmpty(node: SlateNode) {
  return node?.children?.length === 1 && node.children[0]?.text === "";
}

export function toHtml(body: SlateNode[], ctx?: SlateContext) {
  return renderToString(
    <>
      {body?.map((node, index: number) => (
        <div key={index} style={{ padding: "0 20px", lineHeight: "24px" }}>
          {renderDOMNode(node, ctx)}
        </div>
      ))}
    </>
  );
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
