import { Box, BoxProps, PseudoBox } from "@chakra-ui/core";
import {
  getElementDeserializer,
  getRenderElement,
  SlatePlugin,
} from "@udecode/slate-plugins";
import { ReactNode } from "react";
import { RenderElementProps, useFocused, useSelected } from "slate-react";

export type Placeholder = {
  value: string;
  label: string;
};

export function PlaceholderPlugin(placeholders: Placeholder[]): SlatePlugin {
  return {
    renderElement: getRenderElement({
      type: "placeholder",
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
    }),
    deserialize: {
      element: getElementDeserializer("placeholder", {
        createElement: (el) => ({
          type: "placeholder",
          value: el.getAttribute("data-placeholder"),
        }),
      }),
    },
  };
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
      data-placeholder={value}
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
      marginX="0.1em"
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
