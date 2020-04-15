import { MjmlText } from "mjml-react";
import React, { CSSProperties } from "react";

function render(node: any, index: number) {
  if (Array.isArray(node.children)) {
    switch (node.type) {
      case "paragraph":
      case undefined:
        return (
          <MjmlText key={index} padding="0 20px" lineHeight="24px">
            <p style={{ margin: 0 }}>
              {paragraphIsEmpty(node) ? <br /> : node.children.map(render)}
            </p>
          </MjmlText>
        );
      case "bulleted-list":
        return (
          <MjmlText key={index} padding="0 20px 0 45px" lineHeight="24px">
            <ul style={{ margin: 0, padding: 0 }}>
              {node.children.map((child: any, index: number) => (
                <li key={index} style={{ margin: 0, padding: 0 }}>
                  {child.children.map(render)}
                </li>
              ))}
            </ul>
          </MjmlText>
        );
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

export function RenderSlate({ value }: { value: any }) {
  return <>{value?.map(render)}</>;
}
