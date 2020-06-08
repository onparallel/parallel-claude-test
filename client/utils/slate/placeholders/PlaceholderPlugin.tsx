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
          {...attributes}
        >
          {children}
        </PlaceholderToken>
      );
    },
  });
}

const PlaceholderToken = forwardRef(function (
  {
    value,
    label,
    children,
    ...props
  }: BoxProps & {
    value: string;
    label: string;
    children: ReactNode;
  },
  ref: Ref<HTMLElement>
) {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <Box
      {...props}
      contentEditable={false}
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
      ref={ref}
      data-slate-value={value}
    >
      <PseudoBox
        as="span"
        data-placeholder-label={label}
        _before={{ content: `attr(data-placeholder-label)` }}
      ></PseudoBox>
      <PseudoBox as="span" fontSize={0}>{`#${value}#`}</PseudoBox>
      {children}
    </Box>
  );
});
