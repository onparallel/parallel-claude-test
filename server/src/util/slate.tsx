import React, { Fragment } from "react";
import { renderToString } from "react-dom/server";
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
      return fullName(ctx.contact?.first_name, ctx.contact?.last_name)!;
    case "contact-email":
      return ctx.contact?.email ?? "";
    case "user-first-name":
      return ctx.user?.first_name ?? "";
    case "user-last-name":
      return ctx.user?.last_name ?? "";
    case "user-full-name":
      return fullName(ctx.user?.first_name, ctx.user?.last_name)!;
    case "petition-title":
      return ctx.petition?.name ?? "";
    default:
      return "";
  }
}

function renderSlate(node: SlateNode | SlateNode[], ctx?: SlateContext) {
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{renderSlate(child, ctx)}</Fragment>
    ));
  }
  if (Array.isArray(node.children)) {
    switch (node.type) {
      case "paragraph":
      case undefined:
        return (
          <p style={{ margin: 0 }}>
            {paragraphIsEmpty(node) ? <br /> : renderSlate(node.children, ctx)}
          </p>
        );
      case "placeholder":
        return (
          <span>{renderWhiteSpace(getPlaceholder(node.placeholder, ctx))}</span>
        );
      case "bulleted-list":
        return (
          <ul style={{ margin: 0, marginLeft: "24px", paddingLeft: 0 }}>
            {renderSlate(node.children, ctx)}
          </ul>
        );
      case "list-item": {
        return (
          <li style={{ marginLeft: 0 }}>{renderSlate(node.children, ctx)}</li>
        );
      }
    }
  } else if (typeof node.text === "string") {
    return (
      <span
        style={{
          fontWeight: node.bold ? "bold" : undefined,
          fontStyle: node.italic ? "italic" : undefined,
          textDecoration: node.underline ? "underline" : undefined,
        }}
      >
        {renderWhiteSpace(node.text)}
      </span>
    );
  }
  return null;
}

function paragraphIsEmpty(node: SlateNode) {
  return node?.children?.length === 1 && node.children[0]?.text === "";
}

function renderWhiteSpace(text: string) {
  return text.split(/ ( +)/).map((part, index) => (
    <Fragment key={index}>
      {part.match(/^ +$/) ? (
        <>
          {" "}
          {part.split("").map((_, index) => (
            <Fragment key={index}>&nbsp;</Fragment>
          ))}
        </>
      ) : (
        part
      )}
    </Fragment>
  ));
}

export function toHtml(body: SlateNode[], ctx: SlateContext = {}) {
  return renderToString(<>{renderSlate(body, ctx)}</>).replace(
    /<!-- --> <!-- -->(\u00A0<!-- -->)+/g,
    function (match) {
      const extra = (match.length - 17) / 9;
      return " " + "&nbsp;".repeat(extra);
    }
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

export function fromPlainText(value: string): SlateNode[] {
  return value
    .split("\n")
    .map((line) => ({ type: "paragraph", children: [{ text: line }] }));
}

export function slateParser(ctx?: SlateContext) {
  return {
    toHtml: (body: SlateNode[]) => toHtml(body, ctx),
    toPlainText: (body: SlateNode[]) => toPlainText(body, ctx),
  };
}
