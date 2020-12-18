import { Box } from "@chakra-ui/react";
import {
  getNodeDeserializer,
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
      rootProps: {},
      hotkey: undefined as any,
      defaultType: undefined as any,
    }),
    deserialize: {
      element: getNodeDeserializer({
        type: "placeholder",
        node: (el) => ({
          type: "placeholder",
          value: el.getAttribute("data-placeholder"),
        }),
        rules: [{ className: "slate-placeholder" }],
      }),
    },
  };
}

const PlaceholderToken = function ({
  value,
  label,
  attributes,
  children,
}: {
  value: string;
  label: string;
  attributes: any;
  children: ReactNode;
}) {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <Box
      className="slate-placeholder"
      contentEditable={false}
      data-placeholder={value}
      {...attributes}
      as="span"
      display="inline-block"
      backgroundColor="purple.500"
      color="white"
      borderRadius="sm"
      fontSize="xs"
      boxShadow={selected && focused ? "outline" : "none"}
      textTransform="uppercase"
      paddingX={1}
      marginX="0.1em"
      position="relative"
      top="-1px"
    >
      <Box
        as="span"
        data-placeholder-label={label}
        _before={{ content: `attr(data-placeholder-label)` }}
      />
      <Box as="span" fontSize={0} aria-hidden>{`#${value}#`}</Box>
      {children}
    </Box>
  );
};
