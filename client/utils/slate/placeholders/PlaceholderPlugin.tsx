import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { HighlightText } from "@parallel/components/common/HighlightText";
import useMergedRef from "@react-hook/merged-ref";
import {
  getNodeDeserializer,
  getRenderElement,
  SlatePlugin,
} from "@udecode/slate-plugins";
import { ReactNode, useEffect, useRef } from "react";
import { RenderElementProps, useFocused, useSelected } from "slate-react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { PlaceholderElement } from "../types";

export type Placeholder = {
  value: string;
  label: string;
};

export function PlaceholderPlugin(placeholders: Placeholder[]): SlatePlugin {
  return {
    renderElementDeps: [placeholders],
    renderElement: getRenderElement({
      type: "placeholder",
      component: (props: RenderElementProps) => {
        const { children, attributes } = props;
        const element = props.element as PlaceholderElement;
        const placeholder = placeholders.find(
          (p) => p.value === element.placeholder
        );
        return placeholder ? (
          <PlaceholderToken
            value={element.placeholder}
            label={placeholder.label}
            attributes={attributes}
          >
            {children}
          </PlaceholderToken>
        ) : null;
      },
      rootProps: {},
      hotkey: undefined as any,
      defaultType: undefined as any,
    }) as any,
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

interface PlaceholderMenuProps {
  menuId: string;
  itemIdPrefix: string;
  search?: string | null;
  values: Placeholder[];
  selectedIndex: number;
  onAddPlaceholder: (placeholder: Placeholder) => void;
  onHighlightOption: (index: number) => void;
}

export const PlaceholderMenu = chakraForwardRef<"div", PlaceholderMenuProps>(
  function PlaceholderMenu(
    {
      search,
      menuId,
      itemIdPrefix,
      values,
      selectedIndex,
      onAddPlaceholder,
      onHighlightOption,
      ...props
    },
    ref
  ) {
    const menuRef = useRef<HTMLElement>(null);
    const mergedRef = useMergedRef(ref, menuRef);
    useEffect(() => {
      const element = menuRef.current?.children.item(selectedIndex);
      if (element) {
        scrollIntoView(element, { block: "nearest", scrollMode: "if-needed" });
      }
    }, [selectedIndex]);
    return (
      <Card
        as="div"
        ref={mergedRef}
        id={menuId}
        role="listbox"
        overflow="auto"
        maxHeight="180px"
        paddingY={1}
        {...props}
      >
        {values.map((placeholder, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box
              key={placeholder.value}
              id={`${itemIdPrefix}-${placeholder.value}`}
              role="option"
              aria-selected={isSelected ? "true" : undefined}
              backgroundColor={isSelected ? "gray.100" : "white"}
              paddingX={4}
              paddingY={1}
              cursor="pointer"
              onMouseDown={() => onAddPlaceholder(placeholder)}
              onMouseEnter={() => onHighlightOption(index)}
            >
              <Box whiteSpace="nowrap">
                <HighlightText text={placeholder.label} search={search ?? ""} />
              </Box>
            </Box>
          );
        })}
      </Card>
    );
  }
);

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
