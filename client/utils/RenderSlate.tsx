import {
  RichTextBlock,
  RichTextEditorContent,
  RichTextLeaf,
} from "@parallel/components/common/RichTextEditor";
import { memo } from "react";
import { Box, Text, BoxProps, List, ListItem } from "@chakra-ui/core";

function render(node: RichTextBlock | RichTextLeaf, index: number) {
  if (Array.isArray(node.children)) {
    const props: BoxProps = { key: index };
    switch (node.type) {
      case "paragraph":
      case undefined:
        props.as = "p";
        break;
      case "bulleted-list":
        props.as = List;
        props.paddingLeft = 5;
        break;
      case "list-item":
        props.as = ListItem;
        props.listStyleType = "disc";
        props.listStylePosition = "outside";
        break;
    }
    return <Box {...props}>{node.children.map(render)}</Box>;
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

export const RenderSlate = memo(function RenderSlate({
  value,
  ...props
}: BoxProps & {
  value: RichTextEditorContent;
}) {
  return <Box {...props}>{value?.map(render)}</Box>;
});
