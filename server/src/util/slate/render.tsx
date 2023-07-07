import { Fragment, ReactNode, createElement } from "react";
import { isDefined } from "remeda";

import { renderToString } from "react-dom/server";
import { paragraphIsEmpty } from "./utils";

export type SlateNode = {
  children?: SlateNode[];
  type?:
    | "paragraph"
    | "heading"
    | "subheading"
    | "bulleted-list"
    | "numbered-list"
    | "list-item"
    | "list-item-child"
    | "link"
    | "placeholder"
    | "mention";
  placeholder?: string;
  url?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  mention?: string;
};

export interface RenderSlateOptions<TResult = string> {
  override: Record<string, (node: SlateNode) => TResult>;
}

export interface RenderSlateToHtmlOptions extends RenderSlateOptions<ReactNode> {
  startingHeadingLevel: number;
}

export function renderWhiteSpace(text: string) {
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

export function renderSlateToReactNodes(
  node: SlateNode | SlateNode[],
  options?: Partial<RenderSlateToHtmlOptions>,
): ReactNode {
  const opts: RenderSlateToHtmlOptions = {
    startingHeadingLevel: 1,
    override: {},
    ...options,
  };
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      return <Fragment key={index}>{renderSlateToReactNodes(child, opts)}</Fragment>;
    });
  }
  if (Array.isArray(node.children)) {
    switch (node.type) {
      case "paragraph":
      case "list-item-child":
      case undefined: {
        return (
          <p style={{ margin: 0 }}>
            {paragraphIsEmpty(node) ? <br /> : renderSlateToReactNodes(node.children, opts)}
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
          paragraphIsEmpty(node) ? <br /> : renderSlateToReactNodes(node.children, opts),
        );
      case "bulleted-list":
      case "numbered-list":
        return createElement(
          node.type === "bulleted-list" ? "ul" : "ol",
          { style: { margin: 0, marginLeft: "24px", paddingLeft: 0 } },
          renderSlateToReactNodes(node.children, opts),
        );
      case "list-item": {
        return <li style={{ marginLeft: 0 }}>{renderSlateToReactNodes(node.children, opts)}</li>;
      }
      case "link": {
        return (
          <a href={node.url} target="_blank" rel="noopener noreferrer">
            {renderSlateToReactNodes(node.children, opts)}
          </a>
        );
      }
      default:
        if (isDefined(opts.override[node.type])) {
          return opts.override[node.type](node);
        } else {
          return null;
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

export function renderSlateToHtml(nodes: SlateNode[], options?: Partial<RenderSlateToHtmlOptions>) {
  const opts: RenderSlateToHtmlOptions = {
    startingHeadingLevel: 1,
    override: {},
    ...options,
  };
  return renderToString(<>{renderSlateToReactNodes(nodes, opts)}</>).replace(
    /<!-- --> <!-- -->(\u00A0<!-- -->)+/g,
    function (match) {
      const extra = (match.length - 17) / 9;
      return " " + "&nbsp;".repeat(extra);
    },
  );
}

export function renderSlateToText(nodes: SlateNode[], options?: Partial<RenderSlateOptions>) {
  const opts: RenderSlateOptions = {
    override: {},
    ...options,
  };
  function render(node: SlateNode, parent?: SlateNode, index?: number): string {
    if (Array.isArray(node.children)) {
      switch (node.type) {
        case "paragraph":
        case undefined:
        case "heading":
        case "subheading":
          return node.children.map((child) => render(child, node)).join("");
        case "bulleted-list":
        case "numbered-list":
          return node.children
            .map((child, i) => render(child, node, i))
            .join("\n")
            .replace(/^/gm, "  ");
        case "list-item":
          return node.children
            .map((child, i: number) => {
              switch (child.type) {
                // first child on list-item used to be a paragraph
                case "paragraph":
                case "list-item-child":
                  const prefix = parent!.type === "bulleted-list" ? "- " : `${index! + 1}. `;
                  return `${prefix}${child.children!.map((c) => render(c, child)).join("")}`;
                case "bulleted-list":
                case "numbered-list":
                  return render(child, node);
                default:
                  throw new Error(`Unexpected child of list-item ${child.type}`);
              }
            })
            .join("\n");
        case "link":
          return `${node.children.map((child) => render(child, node)).join("")}`;
        default:
          if (isDefined(opts.override[node.type])) {
            return opts.override[node.type](node);
          } else {
            return "";
          }
      }
    } else if (typeof node.text === "string") {
      return node.text;
    }
    return "";
  }
  return nodes.map((child) => render(child)).join("\n");
}
