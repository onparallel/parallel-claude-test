import { RichTextEditorContent } from "@parallel/components/common/RichTextEditor";
import { Element, Text as Leaf } from "slate";
import { memo } from "react";
import { Box, Text, TextProps } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";

function render(node: Element | Leaf, index?: number) {
  if (Array.isArray(node.children)) {
    const content = paragraphIsEmpty(node as Element) ? (
      <br />
    ) : (
      node.children.map(render)
    );
    switch (node.type) {
      case "paragraph":
      case undefined:
        return (
          <Box key={index} as="p">
            {content}
          </Box>
        );
      case "bulleted-list":
        return (
          <Box key={index} as="ul" paddingLeft={6}>
            {content}
          </Box>
        );
        break;
      case "list-item":
        return (
          <Box key={index} as="li">
            {content}
          </Box>
        );
      default:
        return <Box key={index}>{content}</Box>;
    }
  } else if (typeof node.text === "string") {
    const props: TextProps = { key: index };
    if (node.bold) {
      props.fontWeight = "bold";
    }
    if (node.italic) {
      props.fontStyle = "italic";
    }
    if (node.underline) {
      props.textDecoration = "underline";
    }
    return (
      <Text as="span" {...props}>
        {node.text}
      </Text>
    );
  }
  return null;
}

function paragraphIsEmpty(node: Element) {
  return node.children.length === 1 && node.children[0]?.text === "";
}

export const RenderSlate = memo(function RenderSlate({
  value,
  ...props
}: ExtendChakra<{
  value: RichTextEditorContent;
}>) {
  return <Box {...props}>{value?.map(render)}</Box>;
});
