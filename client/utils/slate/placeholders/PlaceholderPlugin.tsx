/** @jsx jsx */
import { Box, BoxProps, PseudoBox } from "@chakra-ui/core";
import { jsx } from "@emotion/core";
import { MentionPlugin } from "@udecode/slate-plugins";
import { forwardRef, ReactNode, Ref } from "react";
import { RenderElementProps, useFocused, useSelected } from "slate-react";

export type Placeholder = {
  value: string;
  label: string;
};

export function PlaceholderPlugin(placeholders: Placeholder[]) {
  return MentionPlugin({
    typeMention: "placeholder",
    prefix: "#",
    component: ({ children, attributes, element }: RenderElementProps) => {
      const placeholder = placeholders.find(
        (p) => p.value === element.placeholder
      )!;
      return (
        <PlaceholderToken
          value={element.placeholder as string}
          label={placeholder.label}
          attributes={attributes}
        >
          {children}
        </PlaceholderToken>
      );
    },
  });
}

const PlaceholderToken = function ({
  value,
  label,
  attributes,
  children,
}: BoxProps & {
  value: string;
  label: string;
  attributes: any;
  children: ReactNode;
}) {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <Box
      contentEditable={false}
      data-slate-value={value}
      {...attributes}
      as="span"
      display="inline-block"
      backgroundColor="purple.500"
      color="white"
      rounded="md"
      fontSize="xs"
      shadow={selected && focused ? "outline" : "none"}
      textTransform="uppercase"
      paddingX={1}
      position="relative"
      top="-1px"
    >
      <PseudoBox
        as="span"
        data-placeholder-label={label}
        _before={{ content: `attr(data-placeholder-label)` }}
      ></PseudoBox>
      <PseudoBox as="span" fontSize={0} aria-hidden>{`#${value}#`}</PseudoBox>
      {children}
    </Box>
  );
};
