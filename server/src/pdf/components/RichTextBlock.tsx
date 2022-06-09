import { Link, Text, View } from "@react-pdf/renderer";
import { Fragment, ReactNode } from "react";
import { paragraphIsEmpty, renderWhiteSpace, SlateNode } from "../../util/slate";

interface RichTextBlockProps {
  children: SlateNode[];
}

function renderSlateToReactPdf(node: SlateNode | SlateNode[]): ReactNode {
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{renderSlateToReactPdf(child)}</Fragment>
    ));
  }
  if (Array.isArray(node.children)) {
    switch (node.type) {
      case "paragraph":
      case undefined: {
        return paragraphIsEmpty(node) ? (
          <Text>{"\n"}</Text>
        ) : (
          <Text>{renderSlateToReactPdf(node.children)}</Text>
        );
      }
      case "link": {
        return (
          <Link style={{ color: "#5650de" }} src={node.url!}>
            {renderSlateToReactPdf(node.children)}
          </Link>
        );
      }
    }
  } else if (typeof node.text === "string") {
    return (
      <Text
        style={{
          fontWeight: node.bold ? "bold" : undefined,
          fontStyle: node.italic ? "italic" : undefined,
          textDecoration: node.underline ? "underline" : undefined,
        }}
      >
        {renderWhiteSpace(node.text)}
      </Text>
    );
  }
  return null;
}

export function RichTextBlock({ children }: RichTextBlockProps) {
  return <View>{renderSlateToReactPdf(children)}</View>;
}
