import { Link, Text, View } from "@react-pdf/renderer";
import { Fragment } from "react";
import { paragraphIsEmpty, renderWhiteSpace, SlateNode } from "../../util/slate";
import { MaybeArray } from "../../util/types";

interface RichTextBlockProps {
  children: SlateNode[];
}

function renderSlateToReactPdf(node: SlateNode | SlateNode[]): MaybeArray<JSX.Element> {
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
          <Text>
            {renderSlateToReactPdf(node.children)}
            {"\n"}
          </Text>
        );
      }
      case "link": {
        return <Link src={node.url!}>{renderSlateToReactPdf(node.children)}</Link>;
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
  return null as never;
}

export function RichTextBlock({ children }: RichTextBlockProps) {
  return <View>{renderSlateToReactPdf(children)}</View>;
}
