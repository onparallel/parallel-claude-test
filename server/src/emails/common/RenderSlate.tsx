import { MjmlText } from "mjml-react";
import React, { CSSProperties, Fragment } from "react";

function render(node: any) {
  if (Array.isArray(node.children)) {
    switch (node.type) {
      case "paragraph":
      case undefined:
        return (
          <p style={{ margin: 0 }}>
            {paragraphIsEmpty(node) ? (
              <br />
            ) : (
              node.children.map((child: any, index: number) => (
                <Fragment key={index}>{render(child)}</Fragment>
              ))
            )}
          </p>
        );
      case "bulleted-list":
        return (
          <ul style={{ margin: 0, paddingLeft: "24px" }}>
            {node.children.map((child: any, index: number) => (
              <li key={index} style={{ marginLeft: 0 }}>
                {child.children.map((child: any, index: number) => (
                  <Fragment key={index}>{render(child)}</Fragment>
                ))}
              </li>
            ))}
          </ul>
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
    return <span style={style}>{node.text}</span>;
  }
  return null;
}

function paragraphIsEmpty(node: any) {
  return node.children.length === 1 && node.children[0]?.text === "";
}

export function RenderSlate({ value }: { value: any }) {
  return (
    <>
      {value?.map((node: any, index: number) => (
        <MjmlText key={index} padding="0 20px" lineHeight="24px">
          {render(node)}
        </MjmlText>
      ))}
    </>
  );
}
