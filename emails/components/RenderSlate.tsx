import React, { createElement, CSSProperties, memo } from "react";

function render(node: any, index: number) {
  if (Array.isArray(node.children)) {
    let elem = "p";
    const style: CSSProperties = { margin: 0, lineHeight: "24px" };
    switch (node.type) {
      case "paragraph":
      case undefined:
        break;
      case "bulleted-list":
        elem = "ul";
        style.paddingLeft = "20px";
        break;
      case "list-item":
        elem = "li";
        style.listStyleType = "disc";
        style.listStylePosition = "outside";
        break;
    }
    return createElement(
      elem,
      { style },
      paragraphIsEmpty(node) ? <br /> : node.children.map(render)
    );
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
      <span key={index} style={style}>
        {node.text}
      </span>
    );
  }
  return null;
}

function paragraphIsEmpty(node: any) {
  return node.children.length === 1 && node.children[0]?.text === "";
}

export const RenderSlate = memo(function RenderSlate({
  value,
}: {
  value: any;
}) {
  return <>{value?.map(render)}</>;
});
