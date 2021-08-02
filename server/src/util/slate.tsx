import React, { Fragment, ReactNode } from "react";
import { createElement } from "react";
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
    | "heading"
    | "subheading"
    | "bulleted-list"
    | "numbered-list"
    | "list-item"
    | "placeholder"
    | "link";
  placeholder?: string;
  url?: string;
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

interface RenderSlateToHtmlOptions {
  startingHeadingLevel: number;
}

function renderSlate(
  node: SlateNode | SlateNode[],
  opts: RenderSlateToHtmlOptions,
  ctx?: SlateContext
): ReactNode {
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{renderSlate(child, opts, ctx)}</Fragment>
    ));
  }
  if (Array.isArray(node.children)) {
    switch (node.type) {
      case "paragraph":
      case undefined: {
        return (
          <p style={{ margin: 0 }}>
            {paragraphIsEmpty(node) ? (
              <br />
            ) : (
              renderSlate(node.children, opts, ctx)
            )}
          </p>
        );
      }
      case "heading":
      case "subheading":
        const type =
          node.type === "heading"
            ? `h${opts.startingHeadingLevel}`
            : `h${opts.startingHeadingLevel + 1}`;
        const fontSize = node.type === "heading" ? "1.25rem" : "1.125rem";
        return createElement(
          type,
          { style: { margin: 0, fontSize, fontWeight: "bold" } },
          paragraphIsEmpty(node) ? (
            <br />
          ) : (
            renderSlate(node.children, opts, ctx)
          )
        );
      case "bulleted-list":
      case "numbered-list":
        return createElement(
          node.type === "bulleted-list" ? "ul" : "ol",
          { style: { margin: 0, marginLeft: "24px", paddingLeft: 0 } },
          renderSlate(node.children, opts, ctx)
        );
      case "list-item": {
        return (
          <li style={{ marginLeft: 0 }}>
            {renderSlate(node.children, opts, ctx)}
          </li>
        );
      }
      case "placeholder":
        return (
          <span>{renderWhiteSpace(getPlaceholder(node.placeholder, ctx))}</span>
        );
      case "link": {
        return (
          <a href={node.url} target="_blank" rel="noopener noreferrer">
            {renderSlate(node.children, opts, ctx)}
          </a>
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

export function toHtml(
  body: SlateNode[],
  ctx: SlateContext = {},
  options?: Partial<RenderSlateToHtmlOptions>
) {
  const opts: RenderSlateToHtmlOptions = {
    startingHeadingLevel: 1,
    ...options,
  };
  return renderToString(<>{renderSlate(body, opts, ctx)}</>).replace(
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
        case "heading":
        case "subheading":
          return `${node.children.map(serialize).join("")}`;
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
        case "placeholder":
          return getPlaceholder(node.placeholder, ctx);
        case "link":
          return `${node.children.map(serialize).join("")}`;
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
