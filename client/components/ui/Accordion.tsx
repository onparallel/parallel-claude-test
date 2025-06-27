/* eslint-disable no-restricted-imports */
import {
  AccordionButton,
  AccordionButtonProps,
  AccordionIcon,
  AccordionIconProps,
  AccordionItem,
  AccordionItemProps,
  AccordionPanel,
  AccordionPanelProps,
  AccordionProps,
  Accordion as ChakraAccordion,
} from "@chakra-ui/react";
import { forwardRef, ReactNode } from "react";

// Docs: https://chakra-ui.com/docs/components/accordion

// v3 API types
interface AccordionValueChangeDetails {
  value: string[];
}

// Root component - v3 API only
interface AccordionRootProps
  extends Omit<
    AccordionProps,
    "allowMultiple" | "allowToggle" | "defaultIndex" | "index" | "onChange"
  > {
  multiple?: boolean;
  collapsible?: boolean;
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (details: AccordionValueChangeDetails) => void;
}

export const AccordionRoot = forwardRef<HTMLDivElement, AccordionRootProps>((props, ref) => {
  const { multiple, collapsible, defaultValue, value, onValueChange, ...rest } = props;

  // Map v3 props to v2 props
  const v2Props: AccordionProps = {
    ...rest,
    allowMultiple: multiple,
    allowToggle: collapsible,
    defaultIndex: defaultValue?.map(Number),
    index: value?.map(Number),
    onChange: onValueChange
      ? (expandedIndex) => {
          const valueArray = Array.isArray(expandedIndex)
            ? expandedIndex.map(String)
            : expandedIndex !== undefined
              ? [String(expandedIndex)]
              : [];
          onValueChange({ value: valueArray });
        }
      : undefined,
  };

  return <ChakraAccordion ref={ref} {...v2Props} />;
});

// Item component - v3 API with value prop
interface AccordionItemWrapperProps extends AccordionItemProps {
  value?: string; // Required for v3 but optional for gradual migration
}

export const AccordionItemWrapper = forwardRef<HTMLDivElement, AccordionItemWrapperProps>(
  (props, ref) => {
    const { value: _value, ...rest } = props;
    // Note: value prop is stored for future v3 migration but not used in v2
    return <AccordionItem ref={ref} {...rest} />;
  },
);

// ItemTrigger component - maps to AccordionButton
export const AccordionItemTrigger = forwardRef<HTMLButtonElement, AccordionButtonProps>(
  (props, ref) => {
    return <AccordionButton ref={ref} {...props} />;
  },
);

// ItemIndicator component - maps to AccordionIcon
export const AccordionItemIndicator = forwardRef<HTMLElement, AccordionIconProps>((props, ref) => {
  return <AccordionIcon ref={ref} {...props} />;
});

// ItemContent component - maps to AccordionPanel
interface AccordionItemContentProps extends AccordionPanelProps {
  children?: ReactNode;
}

export const AccordionItemContent = forwardRef<HTMLDivElement, AccordionItemContentProps>(
  (props, ref) => {
    return <AccordionPanel ref={ref} {...props} />;
  },
);

// ItemBody component - wrapper for content inside ItemContent
interface AccordionItemBodyProps {
  children?: ReactNode;
  [key: string]: any;
}

export const AccordionItemBody = forwardRef<HTMLDivElement, AccordionItemBodyProps>(
  (props, ref) => {
    return <div ref={ref} {...props} />;
  },
);

// Namespace to use as Accordion.XXX
export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItemWrapper,
  ItemTrigger: AccordionItemTrigger,
  ItemIndicator: AccordionItemIndicator,
  ItemContent: AccordionItemContent,
  ItemBody: AccordionItemBody,
};

// Assign display names for debugging
AccordionRoot.displayName = "Accordion.Root";
AccordionItemWrapper.displayName = "Accordion.Item";
AccordionItemTrigger.displayName = "Accordion.ItemTrigger";
AccordionItemIndicator.displayName = "Accordion.ItemIndicator";
AccordionItemContent.displayName = "Accordion.ItemContent";
AccordionItemBody.displayName = "Accordion.ItemBody";
