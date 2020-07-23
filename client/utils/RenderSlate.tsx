import { RichTextEditorContent } from "@parallel/components/common/RichTextEditor";
import { Element, Text as Leaf } from "slate";
import { memo } from "react";
import { Box, Text, BoxProps } from "@chakra-ui/core";

function render(node: Element | Leaf, index?: number) {
  if (Array.isArray(node.children)) {
    const props: BoxProps = { key: index };
    switch (node.type) {
      case "paragraph":
      case undefined:
        props.as = "p";
        break;
      case "bulleted-list":
        props.as = "ul";
        props.paddingLeft = 6;
        break;
      case "list-item":
        props.as = "li";
        break;
    }
    return (
      <Box {...props}>
        {paragraphIsEmpty(node as Element) ? <br /> : node.children.map(render)}
      </Box>
    );
  } else if (typeof node.text === "string") {
    const props: BoxProps = { key: index };
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
}: BoxProps & {
  value: RichTextEditorContent;
}) {
  return <Box {...props}>{value?.map(render)}</Box>;
});
